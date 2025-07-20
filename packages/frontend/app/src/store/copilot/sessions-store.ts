import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { CopilotClient } from './client';
import { createChatSessionStore } from './session-store';

export interface ChatSessionsState {
  sessions: Record<string, StoreApi<any>>;
  activeId?: string;

  /* ---------- Actions ---------- */
  create(args: {
    sessionId: string;
    workspaceId: string;
    client: CopilotClient;
  }): StoreApi<any>;
  remove(sessionId: string): void;
  setActive(sessionId?: string): void;
  get(sessionId: string): StoreApi<any> | undefined;
  list(): string[];
}

export function createChatSessionsStore() {
  return createStore<ChatSessionsState>()(
    immer<ChatSessionsState>((set, get) => ({
      sessions: {},
      activeId: undefined,

      create: ({ sessionId, workspaceId, client }) => {
        const existing = get().sessions[sessionId];
        if (existing) return existing;
        const sessionStore = createChatSessionStore({
          sessionId,
          workspaceId,
          client,
        });
        set(state => {
          state.sessions[sessionId] = sessionStore;
        });
        return sessionStore;
      },

      remove: (sessionId: string) => {
        set(state => {
          delete state.sessions[sessionId];
          if (state.activeId === sessionId) {
            state.activeId = undefined;
          }
        });
      },

      setActive: (sessionId?: string) => {
        set(state => {
          state.activeId = sessionId;
        });
      },

      get: (sessionId: string) => get().sessions[sessionId],

      list: () => Object.keys(get().sessions),
    }))
  );
}
