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

  console.log('message', message);
  return (
    <div className={isAssistant ? 'text-left' : 'text-right'}>
      {message.streamObjects?.length ? (
        <ChatContentStreamObjects streamObjects={message.streamObjects} />
      ) : (
        <MarkdownText
          className="inline-block bg-gray-100 rounded px-2 py-1 max-w-full prose"
          text={message.content}
          showCursor={isAssistant && isStreaming}
        />
      )}
    </div>
  );
}
