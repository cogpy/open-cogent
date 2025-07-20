import { ToolSet } from 'ai';

import { createCodeArtifactTool } from './code-artifact';
import { createConversationSummaryTool } from './conversation-summary';
import { createDocComposeTool } from './doc-compose';
import { createDocSemanticSearchTool } from './doc-semantic-search';
import { createExaCrawlTool } from './exa-crawl';
import { createExaSearchTool } from './exa-search';

export interface CustomAITools extends ToolSet {
  code_artifact: ReturnType<typeof createCodeArtifactTool>;
  conversation_summary: ReturnType<typeof createConversationSummaryTool>;
  doc_semantic_search: ReturnType<typeof createDocSemanticSearchTool>;
  doc_compose: ReturnType<typeof createDocComposeTool>;
  web_search_exa: ReturnType<typeof createExaSearchTool>;
  web_crawl_exa: ReturnType<typeof createExaCrawlTool>;
}

export * from './code-artifact';
export * from './conversation-summary';
export * from './doc-compose';
export * from './doc-semantic-search';
export * from './error';
export * from './exa-crawl';
export * from './exa-search';
