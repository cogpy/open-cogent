import { useEffect, useRef, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';

import { MessageRenderer } from '@/pages/chats/renderers/message';
import type { ChatSessionState, ChatMessage } from '@/store/copilot/types';
import { useTypewriter } from '@/lib/hooks/use-typewriter';

export interface ChatPlaybackProps {
  store: StoreApi<ChatSessionState>;
  className?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  showDocumentContext?: boolean;
  documentTitle?: string;
  onStart?: () => void;
  onProgress?: (current: number, total: number) => void;
  onFinish?: () => void;
  /** When true, bypass progressive reveal and show all messages */
  skip?: boolean;
}

/**
 * Displays messages one-by-one at a fixed interval, mimicking a live conversation.
 * No controls are rendered; playback stops automatically after the last message.
 */
export const ChatPlayback = ({
  store,
  className = '',
  headerContent,
  footerContent,
  showDocumentContext = false,
  documentTitle,
  onStart,
  onProgress,
  onFinish,
  skip = false,
}: ChatPlaybackProps) => {
  const messages = useStore(store, s => s.messages);
  const [visibleIdx, setVisibleIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Track whether user is at bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      setShouldAutoScroll(atBottom);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---------------------------------------------------
   * Skip mode handling (must run unconditionally)
   * --------------------------------------------------*/
  const skipHandledRef = useRef(false);
  useEffect(() => {
    if (skip && !skipHandledRef.current) {
      skipHandledRef.current = true;
      onStart?.();
      onProgress?.(messages.length, messages.length);
      onFinish?.();
      // Ensure visibleIdx shows all for consistency
      setVisibleIdx(messages.length - 1);
    }
  }, [skip, messages.length, onStart, onProgress, onFinish]);

  /* ---------------------------------------------------
   * Progressive reveal logic (guarded by !skip)
   * --------------------------------------------------*/
  // Kick-off: show first message once messages arrive
  useEffect(() => {
    if (skip) return;
    if (visibleIdx === -1 && messages.length) {
      setVisibleIdx(0);
    }
  }, [messages.length, visibleIdx, skip]);

  // Emit onStart when first message becomes visible
  const startedRef = useRef(false);
  useEffect(() => {
    if (skip) return;
    if (!startedRef.current && visibleIdx === 0) {
      startedRef.current = true;
      onStart?.();
    }
  }, [visibleIdx, onStart, skip]);

  // Emit progress on each visibleIdx change
  useEffect(() => {
    if (skip) return;
    if (visibleIdx >= 0) {
      onProgress?.(visibleIdx + 1, messages.length);
    }
  }, [visibleIdx, messages.length, onProgress, skip]);

  // Determine if current message typing is complete
  const currentMsg = messages[visibleIdx] as ChatMessage | undefined;
  const isAssistant = currentMsg ? currentMsg.role !== 'user' : false;

  // Derive display text: prefer content; fall back to concatenated text-deltas
  let assistantText = currentMsg?.content ?? '';
  if (isAssistant && (!assistantText || assistantText.trim() === '')) {
    assistantText = (currentMsg?.streamObjects || [])
      .filter(o => o.type === 'text-delta' && typeof o.textDelta === 'string')
      .map(o => o.textDelta as string)
      .join('');
  }

  const targetText = isAssistant ? assistantText : '';
  const typedText = useTypewriter(targetText, 24);

  const typingDone = isAssistant
    ? targetText.length > 0
      ? typedText.length >= targetText.length
      : true
    : true;

  // After current message finished typing, schedule reveal of next
  useEffect(() => {
    if (skip) return;
    if (!typingDone) return;
    if (visibleIdx >= messages.length - 1) return;

    const id = window.setTimeout(() => setVisibleIdx(idx => idx + 1), 600);
    return () => clearTimeout(id);
  }, [typingDone, visibleIdx, messages.length, skip]);

  // Emit finish when timeline completes
  const finishedRef = useRef(false);
  useEffect(() => {
    if (
      !finishedRef.current &&
      visibleIdx >= messages.length - 1 &&
      !skip &&
      typingDone &&
      messages.length > 0
    ) {
      finishedRef.current = true;
      onFinish?.();
    }
  }, [visibleIdx, messages.length, typingDone, onFinish, skip]);

  // Auto-scroll to newest visible message
  useEffect(() => {
    if (!shouldAutoScroll) return;
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [visibleIdx, typedText, shouldAutoScroll]);

  /* -- Skip mode: render everything instantly -------------------------- */
  if (skip) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {headerContent}

        <div className="flex-1 overflow-y-auto py-4">
          {showDocumentContext && documentTitle && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">
                Document Context
              </div>
              <div className="text-sm text-blue-800">{documentTitle}</div>
            </div>
          )}

          <div className="max-w-[800px] mx-auto w-full [&>*:not(:first-child)]:mt-4">
            {messages.map((m, idx) => (
              <MessageRenderer
                key={m.id ?? idx}
                message={m}
                isStreaming={false}
              />
            ))}
          </div>
        </div>

        {footerContent}
      </div>
    );
  }

  const containerClasses = `flex flex-col h-full ${className}`;

  return (
    <div className={containerClasses}>
      {headerContent}

      <div ref={containerRef} className="flex-1 overflow-y-auto py-4 pb-32">
        {showDocumentContext && documentTitle && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Document Context
            </div>
            <div className="text-sm text-blue-800">{documentTitle}</div>
          </div>
        )}

        <div className="max-w-[800px] mx-auto w-full [&>*:not(:first-child)]:mt-4">
          {messages.slice(0, visibleIdx + 1).map((m, idx) => {
            let msgOverride: ChatMessage = m;
            if (idx === visibleIdx && isAssistant && !typingDone) {
              if (m.streamObjects && m.streamObjects.length) {
                // Preserve non-text-delta objects (e.g., tool-call / tool-result) so they remain visible
                const firstTextIdx = m.streamObjects.findIndex(
                  o => o.type === 'text-delta'
                );
                const updatedStreamObjects = m.streamObjects
                  .map((o, i) => {
                    if (i === firstTextIdx && o.type === 'text-delta') {
                      return { ...o, textDelta: typedText } as any;
                    }
                    // For subsequent text-deltas we hide them until typing completes
                    if (o.type === 'text-delta' && i > firstTextIdx) {
                      return null as any;
                    }
                    return o as any;
                  })
                  .filter(Boolean);

                msgOverride = {
                  ...m,
                  streamObjects: updatedStreamObjects,
                };
              } else {
                msgOverride = { ...m, content: typedText };
              }
            }

            return (
              <MessageRenderer
                key={m.id ?? idx}
                message={msgOverride}
                isStreaming={idx === visibleIdx && isAssistant && !typingDone}
              />
            );
          })}
        </div>
      </div>

      {footerContent}
    </div>
  );
};
