import { useEffect, useRef, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';

import { streamMessages } from '@/lib/stream/stream-messages';
import { MessageRenderer } from '@/pages/chats/renderers/message';
import type { ChatMessage, ChatSessionState } from '@/store/copilot/types';

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
  const rawMessages = useStore(store, s => s.rawMessages);
  const messages = useStore(store, s => s.messages);

  // Progressively streamed frames of messages
  const [frames, setFrames] = useState<ChatMessage[]>([]);
  const [streamDone, setStreamDone] = useState(false);
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
  useEffect(() => {
    if (skip) {
      setFrames(messages);
      onStart?.();
      onProgress?.(messages.length, messages.length);
      onFinish?.();
      setStreamDone(true);
      return;
    }

    // ----------------------------------------------
    // Streaming mode: consume generator frame-by-frame
    // ----------------------------------------------
    const generator = streamMessages(rawMessages);

    let started = false;
    let progressCount = 0;

    const step = () => {
      const { value, done } = generator.next();
      if (done || !value) {
        setStreamDone(true);
        onFinish?.();
        clearInterval(intervalId);
        return;
      }

      setFrames(value);

      if (!started) {
        started = true;
        onStart?.();
      }

      if (value.length !== progressCount) {
        progressCount = value.length;
        onProgress?.(progressCount, rawMessages.length);
      }
    };

    // Kick off immediately and then at fixed interval
    step();
    const intervalId = window.setInterval(step, 24);
    return () => clearInterval(intervalId);
  }, [skip, messages, rawMessages, onStart, onProgress, onFinish]);

  // ---------------------------------------------------
  // Auto-scroll to bottom when new content arrives
  // ---------------------------------------------------
  // Auto-scroll to newest visible message
  useEffect(() => {
    if (!shouldAutoScroll) return;
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [frames, shouldAutoScroll]);

  /* -- Skip mode: render everything instantly -------------------------- */
  if (skip) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {headerContent}

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {showDocumentContext && documentTitle && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">
                Document Context
              </div>
              <div className="text-sm text-blue-800">{documentTitle}</div>
            </div>
          )}

          <div className="max-w-[800px] mx-auto w-full flex flex-col [&>*:not(:first-child)]:mt-4">
            {messages.map((m, idx) => (
              <MessageRenderer
                key={(m.id ?? idx) + '-skip'}
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

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 pb-32">
        {showDocumentContext && documentTitle && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Document Context
            </div>
            <div className="text-sm text-blue-800">{documentTitle}</div>
          </div>
        )}

        <div className="max-w-[800px] mx-auto w-full flex flex-col [&>*:not(:first-child)]:mt-4">
          {frames.map((m, idx) => {
            const isAssistant = m.role !== 'user';
            const isStreaming =
              !streamDone && idx === frames.length - 1 && isAssistant;
            return (
              <MessageRenderer
                key={m.id ?? idx}
                message={m}
                isStreaming={isStreaming}
              />
            );
          })}
        </div>
      </div>

      {footerContent}
    </div>
  );
};
