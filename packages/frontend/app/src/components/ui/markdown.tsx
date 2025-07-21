import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

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

const MemoizedMarkdown = memo(
  ({ content, split }: { content: string; split?: boolean }) => {
    const blocks = useMemo(
      () => (split ? parseMarkdownIntoBlocks(content) : [content]),
      [content, split]
    );

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

// Typewriter text with markdown support
export function MarkdownText({
  text,
  loading = false,
  className,
}: {
  text: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(className, 'prose', loading && 'with-cursor')}>
      <MemoizedMarkdown content={text} split={loading} />
    </span>
  );
}
