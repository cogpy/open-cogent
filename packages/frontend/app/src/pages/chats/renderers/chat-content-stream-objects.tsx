// oxlint-disable no-array-index-key
import type { StreamObject } from '@afk/graphql';

import { MessageCard } from '@/components/ui/card/message-card';
import { MarkdownText } from '@/components/ui/markdown';

import { BrowserUseResult } from './browser-use-result';
import { MakeItRealResult } from './make-it-real-result';
import { TodoListResult } from './todo-list-result';
import { WebSearchResult } from './web-search-result';

interface ChatContentStreamObjectsProps {
  streamObjects: StreamObject[];
  isStreaming?: boolean;
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
  isStreaming = false,
}: ChatContentStreamObjectsProps) {
  if (!streamObjects?.length) return null;

  return (
    <div className="flex flex-col gap-2 max-w-full text-left prose">
      {streamObjects.map((obj, idx) => {
        const loading = isStreaming && idx === streamObjects.length - 1;
        switch (obj.type) {
          case 'text-delta':
            return (
              <MarkdownText
                key={idx}
                text={obj.textDelta ?? ''}
                loading={loading}
              />
            );

          case 'reasoning':
            return (
              <div key={idx} className="rounded-md bg-black/[0.05] p-4">
                <MarkdownText text={obj.textDelta ?? ''} loading={loading} />
              </div>
            );

          case 'tool-call':
            if (
              obj.toolName === 'doc_compose' ||
              obj.toolName === 'make_it_real'
            ) {
              return (
                <MessageCard
                  key={idx}
                  status="loading"
                  className="my-5"
                  title={obj.textDelta}
                />
              );
            }
            // Specialized handling for web_search_exa placeholder
            if (obj.toolName === 'web_search_exa') {
              // Attempt to extract query from args (GraphQL returns JSON string or object)
              let query = undefined as string | undefined;
              if (typeof obj.args === 'string') {
                try {
                  const parsed = JSON.parse(obj.args);
                  query = parsed?.query ?? undefined;
                } catch {
                  // ignore
                }
              } else if (obj.args && typeof obj.args === 'object') {
                query = obj.args.query ?? undefined;
              }

              return (
                <MessageCard
                  key={idx}
                  status="loading"
                  className="my-5"
                  title={
                    query
                      ? `Searching the web for "${query}" …`
                      : 'Searching the web …'
                  }
                />
              );
            }

            return (
              <MessageCard
                key={idx}
                status="loading"
                className="my-5"
                title={`Calling ${obj.toolName ?? 'tool'} …`}
              />
            );

          case 'tool-result': {
            // Special handling for make_it_real tool
            if (obj.toolName === 'make_it_real' && obj.result) {
              return (
                <MakeItRealResult
                  key={idx}
                  docId={obj.result.docId}
                  title={obj.result.title}
                />
              );
            }
            if (obj.toolName === 'doc_compose' && obj.result) {
              return (
                <MakeItRealResult
                  key={idx}
                  docId={obj.result.docId}
                  title={obj.result.title}
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

            // Specialized handling for todo list
            if (
              ['todo_list', 'mark_todo'].includes(obj.toolName ?? '') &&
              obj.result?.list
            ) {
              return <TodoListResult key={idx} result={obj.result} />;
            }

            if (obj.toolName === 'browser_use' && obj.result) {
              if (obj.result && typeof obj.result === 'object') {
                return (
                  <BrowserUseResult key={idx} result={obj.result as any} />
                );
              }
              return (
                <MessageCard
                  key={idx}
                  status="loading"
                  className="my-5"
                  title="Browser task processing..."
                />
              );
            }

            // Default tool result display
            return (
              <div
                key={idx}
                className="rounded-md border border-gray-300 p-3 text-sm text-gray-600"
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
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
