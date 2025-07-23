// oxlint-disable no-array-index-key
import { Loading } from '@afk/component';
import type { StreamObject } from '@afk/graphql';
import { CheckBoxCheckSolidIcon, EmbedWebIcon } from '@blocksuite/icons/rc';

import { MessageCard } from '@/components/ui/card/message-card';
import { MarkdownText } from '@/components/ui/markdown';

import { BrowserUseResult, transformStep } from './browser-use-result';
import { CodeArtifactResult } from './code-artifact-result';
import { GeneratingCard } from './generating-card';
import { GenericToolCalling } from './generic-tool-calling';
import { GenericToolResult } from './generic-tool-result';
import { MakeItRealResult } from './make-it-real-result';
import { TodoListResult } from './todo-list-result';
import { WebCrawlResult } from './web-crawl-result';
import { WebSearchResult } from './web-search-result';

interface ChatContentStreamObjectsProps {
  streamObjects: StreamObject[];
  isStreaming?: boolean;
  isAssistant?: boolean;
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
  isAssistant = false,
}: ChatContentStreamObjectsProps) {
  if (!streamObjects?.length) return null;

  return (
    <div className="flex flex-col gap-2 max-w-full text-left prose w-full">
      {streamObjects.map((obj, idx) => {
        const loading = isStreaming && idx === streamObjects.length - 1;
        switch (obj.type) {
          case 'text-delta': {
            return (
              <MarkdownText
                key={idx}
                text={obj.textDelta ?? ''}
                loading={loading}
                className={isAssistant ? 'min-w-full' : undefined}
              />
            );
          }

          case 'reasoning':
            return (
              <div key={idx} className="rounded-md bg-black/[0.05] p-4">
                <MarkdownText
                  className={isAssistant ? 'min-w-full' : undefined}
                  text={obj.textDelta ?? ''}
                  loading={loading}
                />
              </div>
            );

          case 'tool-call':
            if (
              obj.toolName === 'doc_compose' ||
              obj.toolName === 'make_it_real'
            ) {
              return (
                <GeneratingCard
                  key={idx}
                  title={'Generating...'}
                  content={obj.textDelta ?? ''}
                  icon={<Loading />}
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
                <GenericToolCalling
                  key={idx}
                  title={
                    query
                      ? `Searching the web for "${query}"`
                      : 'Searching the web'
                  }
                />
              );
            }

            if (obj.toolName === 'web_crawl_exa') {
              const url = obj.args?.url;
              return (
                <GenericToolCalling
                  key={idx}
                  title={`Crawling "${url}"`}
                  icon={<EmbedWebIcon />}
                />
              );
            }

            if (obj.toolName === 'browser_use' && obj.textDelta) {
              const result = transformStep(obj.textDelta as any);
              if (result) {
                return <BrowserUseResult key={idx} result={result} />;
              } else {
                return 'Error';
              }
            }

            if (obj.toolName === 'python_coding') {
              // TODO(@CatsJuice)
            }
            if (obj.toolName === 'e2b_python_sandbox') {
              return (
                <div
                  key={idx}
                  className="rounded-md border border-gray-300 p-3 text-sm text-gray-600"
                >
                  {obj.textDelta}
                </div>
              );
            }

            return (
              <GenericToolCalling
                key={idx}
                title={`Calling ${obj.toolName ?? 'tool'} …`}
              />
            );

          case 'tool-result': {
            if (obj.toolName === 'code_artifact' && obj.result) {
              return <CodeArtifactResult result={obj.result} />;
            }
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
            if (obj.toolName === 'web_crawl_exa' && obj.result) {
              const results =
                obj.result.results || obj.result.data || obj.result;
              return (
                <WebCrawlResult
                  key={idx}
                  results={Array.isArray(results) ? results : [results]}
                />
              );
            }

            // Specialized handling for todo list
            if (
              ['todo_list', 'mark_todo'].includes(obj.toolName ?? '') &&
              obj.result?.list
            ) {
              return <TodoListResult key={idx} result={obj.result as any} />;
            }

            // Specialized handling for e2b python sandbox
            if (obj.toolName === 'e2b_python_sandbox' && obj.result) {
              return (
                <div
                  key={idx}
                  className="rounded-md border border-gray-300 p-3 text-sm text-gray-600"
                >
                  {JSON.stringify(obj.result)}
                </div>
              );
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
              <GenericToolResult
                icon={<CheckBoxCheckSolidIcon />}
                title={`${obj.toolName ?? 'Tool'} result`}
              >
                <pre className="whitespace-pre-wrap break-all text-xs max-h-48 overflow-auto">
                  {JSON.stringify(obj.result, null, 2)}
                </pre>
              </GenericToolResult>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
