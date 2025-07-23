import type { Element, Root } from 'hast';
import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

import { cn } from '@/lib/utils';

import * as styles from './markdown.css';

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

function remarkStripFootnoteRefs() {
  return (tree: Root) => {
    visit(tree, 'text', node => {
      node.value = node.value.replaceAll(/\[\^[^\]]*\]/g, '');
    });
  };
}

/* ────────────────────────────────────────── */
/* helper: pull first external <a> from each <li> */
function extractLinks(footnoteSection: Element) {
  const links: { href: string; text: string }[] = [];

  // <ol> is child #1 of the <section>
  const ol = footnoteSection.children.find(
    n => n.type === 'element' && n.tagName === 'ol'
  ) as Element | undefined;
  if (!ol) return links;

  for (const li of ol.children) {
    if (li.type !== 'element' || li.tagName !== 'li') continue;

    const p = li.children.find(
      n => n.type === 'element' && n.tagName === 'p'
    ) as Element | undefined;
    if (!p) continue;

    const a = p.children.find(
      n =>
        n.type === 'element' &&
        n.tagName === 'a' &&
        typeof n.properties?.href === 'string' &&
        !n.properties.href.startsWith('#') // skip the ↩ back-link
    ) as Element | undefined;
    if (!a) continue;

    const textNode = a.children.find(c => c.type === 'text') as any;
    links.push({
      href: a.properties?.href as string,
      text: textNode?.value?.slice(0, -2) ?? a.properties?.href,
    });
  }

  return links;
}

const footnoteComponents: Components = {
  /* colour the in-text superscript */
  sup({ node, children, ...rest }) {
    const id = (node?.properties?.id as string) ?? '';
    return id.startsWith('fnref-') ? (
      <sup {...rest} className="text-blue-600">
        {children}
      </sup>
    ) : (
      <sup {...rest}>{children}</sup>
    );
  },

  /* replace the whole footnote block */
  section({ node, ...rest }) {
    if (node?.properties?.dataFootnotes) {
      const links = extractLinks(node);

      return (
        <ol className="mt-4">
          {links.map(({ href, text }) => (
            <li key={href} className="break-all">
              <a href={href} target="_blank" rel="noopener noreferrer">
                {text}
              </a>
            </li>
          ))}
        </ol>
      );
    }

    /* fall back to normal rendering if it’s *not* a footnote block */
    return <section {...rest} />;
  },
};

const MemoizedMarkdownBlock = memo(
  ({ content, split }: { content: string; split?: boolean }) => {
    return (
      <ReactMarkdown
        remarkPlugins={
          split ? [remarkGfm, remarkStripFootnoteRefs] : [remarkGfm]
        }
        components={footnoteComponents}
      >
        {content}
      </ReactMarkdown>
    );
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
      <MemoizedMarkdownBlock
        content={block}
        key={`block_${index}`}
        split={split}
      />
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
    <span
      className={cn(
        className,
        styles.markdownBlock,
        'prose',
        loading && 'with-cursor'
      )}
    >
      <MemoizedMarkdown content={text} split={loading} />
    </span>
  );
}
