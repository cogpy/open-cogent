import type { StreamObject } from '@afk/graphql';
import { produce } from 'immer';
import { z } from 'zod';
import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { CopilotClient } from './client';
import { toTextStream } from './event-source';
import type {
  ChatMessage,
  ChatSessionState,
  SendMessageOptions,
  SessionFlags,
} from './types';

export const StreamObjectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text-delta'),
    textDelta: z.string(),
  }),
  z.object({
    type: z.literal('reasoning'),
    textDelta: z.string(),
  }),
  z.object({
    type: z.literal('tool-call'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.any()),
  }),
  z.object({
    type: z.literal('tool-result'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.any()),
    result: z.any(),
  }),
]);

export function mergeStreamObjects(chunks: StreamObject[] = []) {
  return chunks.reduce((acc, curr) => {
    const prev = acc.at(-1);
    switch (curr.type) {
      case 'reasoning':
      case 'text-delta': {
        if (prev && prev.type === curr.type) {
          acc[acc.length - 1] = {
            ...prev,
            textDelta: (prev.textDelta ?? '') + (curr.textDelta ?? ''),
          };
        } else {
          acc.push(curr);
        }
        break;
      }
      case 'tool-result': {
        const index = acc.findIndex(
          item =>
            item.type === 'tool-call' &&
            item.toolCallId === curr.toolCallId &&
            item.toolName === curr.toolName
        );
        if (index !== -1) {
          acc[index] = curr;
        } else {
          acc.push(curr);
        }
        break;
      }
      default: {
        acc.push(curr);
        break;
      }
    }
    return acc;
  }, [] as StreamObject[]);
}

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
  initialMeta?: unknown | null;
}): StoreApi<ChatSessionState> {
  const { sessionId, client, initialMeta } = params;

  const store = createStore<ChatSessionState>()(
    immer<ChatSessionState>((set, get) => ({
      /* ---------- Data ---------- */
      sessionId,
      meta: (initialMeta as any) ?? null,
      messages: (initialMeta && (initialMeta as any).messages) ?? [],

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
          const histories = await client.getHistories(
            {},
            {
              sessionId,
              withMessages: true,
            }
          );
          const historyEntry = Array.isArray(histories)
            ? histories.find((h: any) => h.sessionId === sessionId)
            : undefined;

          const initialMessages =
            historyEntry?.messages ?? meta?.messages ?? [];

          set(state => {
            state.meta = meta ?? state.meta ?? null;
            if (state.messages.length === 0) {
              state.messages = initialMessages;
            }
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
                  const chunk = ev.data;
                  store.setState(
                    produce((draft: ChatSessionState) => {
                      const last = draft.messages[draft.messages.length - 1];

                      if (last && last.role === 'assistant') {
                        try {
                          const parsed = StreamObjectSchema.parse(
                            JSON.parse(chunk)
                          ) as StreamObject;
                          const streamObjects = mergeStreamObjects([
                            ...(last.streamObjects ?? []),
                            parsed,
                          ]);
                          draft.messages[draft.messages.length - 1] = {
                            ...last,
                            streamObjects,
                          };
                        } catch {
                          draft.messages[draft.messages.length - 1] = {
                            ...last,
                            content: last.content + chunk,
                          };
                        }
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
