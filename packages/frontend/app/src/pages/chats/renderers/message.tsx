import { MemoizedMarkdown, TypewriterText } from '@/components/ui/markdown';
import type { ChatMessage } from '@/store/copilot/types';

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
      <span className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 max-w-full prose dark:prose-invert">
        {isAssistant && isStreaming ? (
          <TypewriterText text={message.content} showCursor />
        ) : (
          <MemoizedMarkdown content={message.content} />
        )}
      </span>
    </div>
  );
}
