import { MarkdownText } from '@/components/ui/markdown';
import type { ChatMessage } from '@/store/copilot/types';

import { ChatContentStreamObjects } from './chat-content-stream-objects';

interface MessageRendererProps {
  /** Chat message to render */
  message: ChatMessage;
  /** Whether this message is currently streaming (typing) */
  isStreaming?: boolean;
  /** Typing speed for typewriter effect (ms per frame) */
  speed?: number;
}

/**
 * Renders a single chat message with proper alignment, markdown formatting and
 * optional streaming cursor.
 */
export function MessageRenderer({
  message,
  isStreaming = false,
}: MessageRendererProps) {
  const isAssistant = message.role !== 'user';
  return (
    <div className={isAssistant ? 'text-left' : 'text-right'}>
      {message.streamObjects?.length ? (
        <ChatContentStreamObjects
          streamObjects={message.streamObjects}
          isStreaming={isStreaming}
        />
      ) : (
        <MarkdownText
          className="inline-block bg-gray-100 p-3 max-w-full prose rounded-lg mb-4"
          text={message.content}
          loading={isAssistant && isStreaming}
        />
      )}
    </div>
  );
}
