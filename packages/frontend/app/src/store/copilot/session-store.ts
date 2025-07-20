import type { PaginationInput } from '@afk/graphql';
import { produce } from 'immer';
import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { CopilotClient } from './client';
import type {
  ChatSessionState,
  SendMessageOptions,
  UpdateSessionOptions,
} from './types';

// Helper to apply immer mutation inside async flow
const withFlag = <K extends keyof ChatSessionState>(
  store: StoreApi<ChatSessionState>,
  flag: K,
  fn: () => Promise<void>
) => {
  const { setState } = store;
  return (async () => {
    // set flag true, clear error
    setState(
      produce((draft: ChatSessionState) => {
        draft[flag] = true as any;
        draft.error = undefined;
      })
    );

    try {
      await fn();
    } catch (err) {
      setState(
        produce((draft: ChatSessionState) => {
          draft.error = (err as Error) ?? new Error('Unknown error');
        })
      );
    } finally {
      // reset flag
      setState(
        produce((draft: ChatSessionState) => {
          draft[flag] = false as any;
        })
      );
    }
  })();
};

export function createChatSessionStore(params: {
  sessionId: string;
  workspaceId: string;
  client: CopilotClient;
}): StoreApi<ChatSessionState> {
  const { sessionId, workspaceId, client } = params;

  const store = createStore<ChatSessionState>()(
    immer<ChatSessionState>((set, get) => ({
      /* ---------- Data ---------- */
      sessionId,
      workspaceId,
      meta: null,
      messages: [],

      /* ---------- Flags ---------- */
      isInitializing: true,
      isLoading: false,
      isSubmitting: false,
      isStreaming: false,
      error: undefined,

      /* ---------- Actions ---------- */
      init: async () => {
        await withFlag(store, 'isInitializing', async () => {
          const meta = await client.getSession(sessionId);
          const initialMessages = meta?.messages ?? [];
          set(state => {
            state.meta = meta ?? null;
            state.messages = initialMessages;
          });
        });
      },

      reload: async () => {
        const { init } = get();
        await init();
      },

      sendMessage: async (options: SendMessageOptions) => {
        await withFlag(store, 'isSubmitting', async () => {
          const message = await client.createMessage(options as any);
          set(state => {
            // Append optimistic or returned message
            if (message) state.messages.push(message as any);
          });
        });
      },

      fetchMoreHistory: async (pagination: PaginationInput) => {
        await withFlag(store, 'isLoading', async () => {
          const more = await client.getHistories(pagination);
          set(state => {
            if (more?.length) {
              // prepend older messages
              state.messages.unshift(...(more as any));
            }
          });
        });
      },

      updateMeta: async (options: UpdateSessionOptions) => {
        await withFlag(store, 'isSubmitting', async () => {
          const updated = await client.updateSession(options as any);
          set(state => {
            state.meta = updated as any;
          });
        });
      },

      cleanup: async (sessionIds: string[]) => {
        await withFlag(store, 'isSubmitting', async () => {
          await client.cleanupSessions({
            workspaceId,
            docId: '', // docId placeholder; client API still expects
            sessionIds,
          });
        });
      },

      clearError: () => {
        set(state => {
          state.error = undefined;
        });
      },
    }))
  );

  // Perform initial load in background
  void store.getState().init();

  return store;
}
