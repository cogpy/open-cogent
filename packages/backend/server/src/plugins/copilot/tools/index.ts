import { ToolSet } from 'ai';

import { createBrowserUseTool } from './browser-use';
import { createCodeArtifactTool } from './code-artifact';
import { createConversationSummaryTool } from './conversation-summary';
import { createDocComposeTool } from './doc-compose';
import { createDocSemanticSearchTool } from './doc-semantic-search';
import { createExaCrawlTool } from './exa-crawl';
import { createExaSearchTool } from './exa-search';
import { createMakeItRealTool } from './make-it-real';
import { createMarkTodoTool, createTodoTool } from './todo';

export interface CustomAITools extends ToolSet {
  browser_use: ReturnType<typeof createBrowserUseTool>;
  code_artifact: ReturnType<typeof createCodeArtifactTool>;
  conversation_summary: ReturnType<typeof createConversationSummaryTool>;
  doc_semantic_search: ReturnType<typeof createDocSemanticSearchTool>;
  doc_compose: ReturnType<typeof createDocComposeTool>;
  web_search_exa: ReturnType<typeof createExaSearchTool>;
  web_crawl_exa: ReturnType<typeof createExaCrawlTool>;
  todo_list: ReturnType<typeof createTodoTool>;
  mark_todo: ReturnType<typeof createMarkTodoTool>;
  make_it_real: ReturnType<typeof createMakeItRealTool>;
}

export * from './browser-use';
export * from './code-artifact';
export * from './conversation-summary';
export * from './doc-compose';
export * from './doc-semantic-search';
export * from './error';
export * from './exa-crawl';
export * from './exa-search';
export * from './make-it-real';
export * from './todo';
