// Replaced `marked` block-splitting with the incremental parser from `@lixpi/markdown-stream-parser`.
// The parser allows us to detect "block defining" segments as the stream progresses. We feed the
// entire markdown string in one go (since this util is synchronous) and collect a new block every
// time the parser notifies us that the current segment starts a fresh block.
import { MarkdownStreamParser } from '@lixpi/markdown-stream-parser';
import type { Element, Root } from 'hast';
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

import { cn } from '@/lib/utils';

import { CodeBlock } from './code-block';
import * as styles from './markdown.css';

// Re-use a single parser instance across calls to avoid the overhead of
// constructing and tearing down a temporary one every render. We keep this
// module-scoped so it lives for the lifetime of the bundle (or until a hot
// reload), and we scope it with a unique ID that is unlikely to clash with
// any other consumer inside the app.
const MARKDOWN_SPLITTER_PARSER_ID = 'markdown-splitter';
const sharedMarkdownParser = MarkdownStreamParser.getInstance(
  MARKDOWN_SPLITTER_PARSER_ID
);

function parseMarkdownIntoBlocks(markdown: string): string[] {
  // Early-out for empty strings – prevents the parser from creating an instance needlessly.
  if (!markdown) return [''];

  // Reuse our shared parser instance. We subscribe/unsubscribe on every call so
  // we still don't leak any listeners or cross-contaminate block buffers
  // between invocations.
  const parser = sharedMarkdownParser;

  const blocks: string[] = [];
  let current = '';

  const unsubscribe = parser.subscribeToTokenParse((parsedSegment: any) => {
    // We only care about streaming tokens that carry a segment payload
    if (parsedSegment.status !== 'STREAMING' || !parsedSegment.segment) {
      return;
    }

    const { segment: segContent, isBlockDefining } = parsedSegment.segment;

    if (isBlockDefining && current) {
      // Push the buffered block (if any) and start a new one
      blocks.push(current);
      current = '';
    }

    current += segContent;
  });

  // Begin parsing → feed → end & flush
  parser.startParsing();
  parser.parseToken(markdown);
  parser.stopParsing();

  unsubscribe();

  if (current) blocks.push(current);

  return blocks;
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

const InPreContext = createContext<boolean>(false);

const CustomCodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const inPre = useContext(InPreContext);
  // code block
  if (inPre) {
    const lang = className?.match(/language-(\w+)/)?.[1] ?? 'text';
    return <CodeBlock language={lang}>{children}</CodeBlock>;
  }

  return <code>{children}</code>;
};

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

  pre({ children }) {
    return (
      <InPreContext.Provider value={true}>
        <pre>{children}</pre>
      </InPreContext.Provider>
    );
  },

  code({ className, children }) {
    return <CustomCodeBlock className={className}>{children}</CustomCodeBlock>;
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
  style,
}: {
  text: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        className,
        styles.markdownBlock,
        'prose',
        loading && 'with-cursor'
      )}
      style={style}
    >
      <MemoizedMarkdown content={text} split={loading} />
    </span>
  );
}

export const TypeMarkdownText = ({
  text,
  loading = false,
  className,
  style,
  speed = 10,
}: {
  text: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  speed?: number | number[];
}) => {
  const [initialStreaming] = useState(loading);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!initialStreaming) {
      setDisplayedContent(text);
      return;
    }

    if (currentIndex < text.length) {
      const delay = Array.isArray(speed)
        ? Math.random() * (speed[1] - speed[0]) + speed[0]
        : speed;
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
    return () => {};
  }, [currentIndex, initialStreaming, speed, text]);

  return (
    <MarkdownText
      text={displayedContent}
      loading={loading}
      className={className}
      style={style}
    />
  );
};
