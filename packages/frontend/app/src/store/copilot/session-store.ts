import { produce } from 'immer';
import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { CopilotClient } from './client';
import { toTextStream } from './event-source';
import type { ChatMessage } from './types';
import type {
  ChatSessionState,
  SendMessageOptions,
  SessionFlags,
  UpdateSessionOptions,
} from './types';

// Helper to apply immer mutation inside async flow
const withFlag = <K extends keyof SessionFlags>(
  store: StoreApi<ChatSessionState>,
  flag: K,
  fn: () => Promise<void>
) => {
  const { setState } = store;
  return (async () => {
    // set flag true, clear error
    setState(
      produce((draft: ChatSessionState) => {
        draft[flag] = true;
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
          draft[flag] = false;
        })
      );
    }
  })();
};

export function createChatSessionStore(params: {
  sessionId: string;
  client: CopilotClient;
}): StoreApi<ChatSessionState> {
  const { sessionId, client } = params;

  const store = createStore<ChatSessionState>()(
    immer<ChatSessionState>((set, get) => ({
      /* ---------- Data ---------- */
      sessionId,
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
        if (!options.content || !options.content.trim()) {
          return;
        }

        const content = options.content.trim();

        await withFlag(store, 'isSubmitting', async () => {
          // Create user message on backend
          const messageId = await client.createMessage({
            ...options,
            content,
            sessionId,
          });

          // Local optimistic user & assistant messages
          const userMsg: ChatMessage = {
            id: messageId ?? null,
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
          };
          const assistantMsg: ChatMessage = {
            id: null,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          };

          set(state => {
            state.messages.push(userMsg);
            state.messages.push(assistantMsg);
          });

          // Stream assistant response in background
          const stream = async () => {
            store.setState(
              produce((draft: ChatSessionState) => {
                draft.isStreaming = true;
              })
            );

            try {
              const es = client.chatTextStream({
                sessionId,
                messageId: messageId ?? undefined,
              });

              for await (const ev of toTextStream(es)) {
                if (ev.type === 'message') {
                  const chunk = ev.data as string;
                  store.setState(
                    produce((draft: ChatSessionState) => {
                      const last = draft.messages[draft.messages.length - 1];
                      if (last && last.role === 'assistant') {
                        last.content += chunk;
                      }
                    })
                  );
                }
                // ignoring attachment events for MVP
              }
            } catch (err) {
              store.setState(
                produce((draft: ChatSessionState) => {
                  draft.error = (err as Error) ?? new Error('Stream error');
                })
              );
            } finally {
              store.setState(
                produce((draft: ChatSessionState) => {
                  draft.isStreaming = false;
                })
              );
            }
          };

          void stream();
        });
      },

      // Fetch older messages by refetching entire session and prepending unseen entries
      loadMore: async (limit = 50) => {
        await withFlag(store, 'isLoading', async () => {
          const meta = await client.getSession(sessionId);
          const serverMessages = meta?.messages ?? [];

          set(state => {
            const existingIds = new Set(state.messages.map(m => m.id));
            const unseen = serverMessages.filter(m => !existingIds.has(m.id));
            state.messages = [...unseen, ...state.messages];
          });
        });
      },

      // Toggle pin status for this session
      togglePin: async () => {
        const pinned = get().meta?.pinned ?? false;
        await withFlag(store, 'isSubmitting', async () => {
          await client.updateSession({
            sessionId,
            pinned: !pinned,
          });

          // Refresh meta
          const meta = await client.getSession(sessionId);
          set(state => {
            state.meta = meta ?? state.meta;
          });
        });
      },

      updateMeta: async (options: UpdateSessionOptions) => {
        await withFlag(store, 'isSubmitting', async () => {
          const updated = await client.updateSession(options);
          set(state => {
            state.meta = updated;
          });
        });
      },

      cleanup: async (sessionIds: string[]) => {
        await withFlag(store, 'isSubmitting', async () => {
          await client.cleanupSessions({
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
