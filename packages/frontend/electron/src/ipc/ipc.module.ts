import { AsyncLocalStorage } from 'node:async_hooks';

import {
  type DynamicModule,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import {
  app,
  BrowserWindow,
  ipcMain,
  type IpcMainInvokeEvent,
  WebContentsView,
} from 'electron';

import { logger } from '../entries/main/logger';
import { IPC_API_CHANNEL_NAME, IPC_EVENT_CHANNEL_NAME } from './constant';
import { IpcScanner } from './ipc-scanner';

/**
 * Injecting IpcMainInvokeEvent to the handler function
 * e.g.,
 *
 * ```
 * @IpcHandle({ scope: IpcScope.UI })
 * async foo() {
 *   const event = getIpcEvent();
 *   const webContents = event.sender;
 * }
 * ```
 */
const ipcEventStore = new AsyncLocalStorage<
  import('electron').IpcMainInvokeEvent
>();

/**
 * Get the current ipc event. Only works if being called within the main process.
 * The use case is to let the handler get access to the caller's webContents.
 */
export const getIpcEvent = () => {
  const event = ipcEventStore.getStore();
  if (!event) {
    throw new Error('No ipc event found');
  }
  return event;
};

@Injectable()
class IpcMainInitializerService implements OnModuleInit {
  context = 'IpcMainInitializerService';
  constructor(private readonly ipcScanner: IpcScanner) {}

  onModuleInit() {
    this.registerHandlers();
    this.registerEventEmitters();
  }

  private registerHandlers() {
    const handlers = this.ipcScanner.scanHandlers();

    const handleIpcMessage = async (...args: any[]) => {
      logger.debug('ipcMain.handle', args[0], this.context);
      // args[0] is the `{namespace:key}`
      if (typeof args[0] !== 'string') {
        logger.error('invalid ipc message', args, this.context);
        return;
      }

      const handler = handlers.get(args[0]);
      if (!handler) {
        logger.error('handler not found for ', args[0], this.context);
        return;
      }

      const realArgs = args.slice(1);

      // Enhanced error handling to prevent server crashes
      try {
        // put the event LAST for ease of use
        const result = await handler(...realArgs);
        return result;
      } catch (error) {
        // Log the error but don't crash the server
        logger.error(`IPC handler error for ${args[0]}:`, error, this.context);

        // Return a structured error response instead of throwing
        return {
          error: true,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'IPC_HANDLER_ERROR',
          timestamp: Date.now(),
        };
      }
    };

    logger.debug(`Found ${handlers.size} IPC handlers`, this.context);

    ipcMain.handle(
      IPC_API_CHANNEL_NAME,
      (e: IpcMainInvokeEvent, ...args: any[]) => {
        return new Promise((resolve, _reject) => {
          ipcEventStore.run(e, () => {
            handleIpcMessage(...args)
              .then(resolve)
              .catch(error => {
                // Enhanced error handling for IPC calls
                logger.error(
                  `IPC call failed for ${args[0]}:`,
                  error,
                  this.context
                );

                // Return structured error instead of rejecting
                resolve({
                  error: true,
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Unknown IPC error',
                  code: 'IPC_CALL_ERROR',
                  timestamp: Date.now(),
                });
              });
          });
        });
      }
    );

    // for handling ipcRenderer.sendSync
    ipcMain.on(IPC_API_CHANNEL_NAME, (e, ...args: any[]) => {
      ipcEventStore.run(e, () => {
        handleIpcMessage(...args)
          .then(ret => {
            e.returnValue = ret;
          })
          .catch(error => {
            // Enhanced error handling for sync calls
            logger.error(
              `IPC sync call failed for ${args[0]}:`,
              error,
              this.context
            );

            // Return structured error instead of crashing
            e.returnValue = {
              error: true,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown IPC sync error',
              code: 'IPC_SYNC_ERROR',
              timestamp: Date.now(),
            };
          });
      });
    });
  }

  private broadcastToAllWindows(channel: string, ...args: any[]) {
    // logger.debug('broadcast event', channel, this.context);
    BrowserWindow.getAllWindows().forEach(win => {
      if (win.isDestroyed()) return;

      try {
        win.webContents?.send(IPC_EVENT_CHANNEL_NAME, channel, ...args);
        if (win.contentView && win.contentView.children) {
          win.contentView.children.forEach(child => {
            if (
              child instanceof WebContentsView &&
              child.webContents &&
              !child.webContents.isDestroyed()
            ) {
              child.webContents.send(IPC_EVENT_CHANNEL_NAME, channel, ...args);
            }
          });
        }
      } catch (error) {
        logger.error('failed to broadcast event', channel, error, this.context);
      }
    });
  }

  private registerEventEmitters() {
    const eventSources = this.ipcScanner.scanEventSources();
    const unsubscribers: (() => void)[] = [];

    logger.debug(`Found ${eventSources.size} IPC event sources`, this.context);

    for (const [channel, eventSource$] of eventSources.entries()) {
      const unsubscribe = eventSource$.subscribe({
        next: (payload: any) => {
          this.broadcastToAllWindows(channel, payload);
        },
      });
      unsubscribers.push(() => unsubscribe.unsubscribe());
    }

    app.on('before-quit', () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    });
  }
}

export class ElectronIpcModule {
  static forMain(): DynamicModule {
    return {
      module: ElectronIpcModule,
      imports: [DiscoveryModule],
      providers: [IpcScanner, IpcMainInitializerService],
      exports: [IpcScanner],
    };
  }

  static forHelper(): DynamicModule {
    return {
      module: ElectronIpcModule,
      imports: [DiscoveryModule],
      providers: [IpcScanner],
      exports: [IpcScanner],
    };
  }
}
