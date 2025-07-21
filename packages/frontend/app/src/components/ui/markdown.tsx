import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return blocks.map((block, index) => (
    <MemoizedMarkdownBlock content={block} key={`block_${index}`} />
  ));
});

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

// Typewriter text with markdown support
export function MarkdownText({
  text,
  showCursor = false,
  className,
}: {
  text: string;
  speed?: number;
  showCursor?: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      <MemoizedMarkdown content={text} />
      {showCursor && (
        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
      )}
    </span>
  );
}
