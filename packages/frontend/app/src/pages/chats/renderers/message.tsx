import { MarkdownText } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/store/copilot/types';

import { ChatContentStreamObjects } from './chat-content-stream-objects';
import * as styles from './message.css';

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
    <div
      className={cn(
        'flex flex-col',
        isAssistant ? 'items-start' : 'items-end',
        !isAssistant && 'pl-10'
      )}
    >
      {message.streamObjects?.length ? (
        <ChatContentStreamObjects
          streamObjects={message.streamObjects}
          isStreaming={isStreaming}
          isAssistant={isAssistant}
        />
      ) : (
        <MarkdownText
          className={cn(
            'inline-block bg-gray-100 p-3 ax-w-full prose rounded-lg mb-4',
            styles.mdMsg
          )}
          text={message.content}
          loading={isAssistant && isStreaming}
        />
      )}
    </div>
  );
}
