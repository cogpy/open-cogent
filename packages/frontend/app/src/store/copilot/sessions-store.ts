import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createRefCounter } from '@/utils/ref-count';

import type { CopilotClient } from './client';
import { createChatSessionStore } from './session-store';
import type { ChatSessionState } from './types';

export interface ChatSessionsState {
  activeId?: string;

  /* ---------- Actions ---------- */
  acquire(args: {
    sessionId: string;
    workspaceId: string;
    client: CopilotClient;
  }): StoreApi<ChatSessionState>;
  release(sessionId: string): void;
  setActive(sessionId?: string): void;
  get(sessionId: string): StoreApi<ChatSessionState> | undefined;
  list(): string[];
}

export function createChatSessionsStore() {
  const registry = createRefCounter<string, StoreApi<ChatSessionState>>();

  return createStore<ChatSessionsState>()(
    immer<ChatSessionsState>(set => ({
      activeId: undefined,

      acquire: ({ sessionId, workspaceId, client }) => {
        return registry.acquire(sessionId, () =>
          createChatSessionStore({ sessionId, workspaceId, client })
        );
      },

      release: (sessionId: string) => {
        registry.release(sessionId, () => {
          // cleanup activeId if needed
          set(state => {
            if (state.activeId === sessionId) state.activeId = undefined;
          });
        });
      },

      setActive: (sessionId?: string) => {
        set(state => {
          state.activeId = sessionId;
        });
      },

      get: (sessionId: string) => registry.get(sessionId),

      list: () => registry.list(),
    }))
  );
}
