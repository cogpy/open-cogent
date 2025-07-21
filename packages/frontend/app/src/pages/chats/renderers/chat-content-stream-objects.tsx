// oxlint-disable no-array-index-key
import type { StreamObject } from '@afk/graphql';

import { MarkdownText } from '@/components/ui/markdown';
import { DocCard } from '@/components/doc-panel/doc-card';
import { MakeItRealResult } from './make-it-real-result';
import { WebSearchResult } from './web-search-result';

interface ChatContentStreamObjectsProps {
  streamObjects: StreamObject[];
}

/**
 * Basic renderer that converts server-side `streamObjects` into simple
 * React components, imitating the logic of the core Lit implementation.
 * – text-delta: rendered as Markdown
 * – reasoning: rendered as Markdown inside a grey box
 * – tool-call: placeholder card "🔧 Calling {toolName} …"
 * – tool-result: placeholder card with the result JSON
 */
export function ChatContentStreamObjects({
  streamObjects,
}: ChatContentStreamObjectsProps) {
  if (!streamObjects?.length) return null;

  return (
    <div className="flex flex-col gap-2 max-w-full text-left prose">
      {streamObjects.map((obj, idx) => {
        switch (obj.type) {
          case 'text-delta':
            return <MarkdownText key={idx} text={obj.textDelta ?? ''} />;

          case 'reasoning':
            return (
              <div key={idx} className="rounded-md bg-black/[0.05] p-4">
                <MarkdownText text={obj.textDelta ?? ''} />
              </div>
            );

          case 'tool-call':
            return (
              <div
                key={idx}
                className="rounded-md border border-dashed border-gray-400 p-3 text-sm text-gray-600"
              >
                <span role="img" aria-label="tool call">
                  🔧
                </span>{' '}
                Calling {obj.toolName ?? 'tool'} …
              </div>
            );

          case 'tool-result':
            // Special handling for make_it_real tool
            if (obj.toolName === 'make_it_real' && obj.result?.content) {
              return (
                <MakeItRealResult
                  key={idx}
                  content={obj.result.content}
                  originalContent={obj.result.originalContent}
                />
              );
            }

            // Special handling for web_search_exa tool
            if (obj.toolName === 'web_search_exa' && obj.result) {
              const results =
                obj.result.results || obj.result.data || obj.result;
              return (
                <WebSearchResult
                  key={idx}
                  results={Array.isArray(results) ? results : [results]}
                  query={obj.result.query}
                />
              );
            }

            // Check if result contains document content (markdown-like text)
            const resultContent =
              obj.result?.content || obj.result?.text || obj.result?.markdown;
            const isDocumentContent =
              typeof resultContent === 'string' &&
              resultContent.length > 100 &&
              (resultContent.includes('#') ||
                resultContent.includes('```') ||
                resultContent.includes('\n\n'));

            if (isDocumentContent) {
              return (
                <DocCard
                  key={idx}
                  content={resultContent}
                  title={obj.toolName ? `${obj.toolName} Result` : 'Document'}
                  description="Generated document content"
                />
              );
            }

            // Default tool result display
            return (
              <div
                key={idx}
                className="rounded-md border border-gray-300 p-3 text-sm text-gray-600 dark:text-gray-300"
              >
                <div className="font-medium mb-1">
                  ✅ {obj.toolName ?? 'Tool'} result
                </div>
                {obj.result ? (
                  <pre className="whitespace-pre-wrap break-all text-xs max-h-48 overflow-auto">
                    {JSON.stringify(obj.result, null, 2)}
                  </pre>
                ) : (
                  <span>No result data.</span>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
