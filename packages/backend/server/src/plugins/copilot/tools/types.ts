import { ToolSet } from 'ai';

import type { createBrowserUseTool } from './browser-use';
import type { createCodeArtifactTool } from './code-artifact';
import type { createConversationSummaryTool } from './conversation-summary';
import type { createDocComposeTool } from './doc-compose';
import type { createDocSemanticSearchTool } from './doc-semantic-search';
import type { createE2bPythonSandboxTool } from './e2b-python-sandbox';
import type { createExaCrawlTool } from './exa-crawl';
import type { createExaSearchTool } from './exa-search';
import type { createMakeItRealTool } from './make-it-real';
import type { createPythonCodingTool } from './python-coding';
import type { createMarkTodoTool, createTodoTool } from './todo';

export interface CustomAITools extends ToolSet {
  browser_use: ReturnType<typeof createBrowserUseTool>;
  code_artifact: ReturnType<typeof createCodeArtifactTool>;
  conversation_summary: ReturnType<typeof createConversationSummaryTool>;
  doc_semantic_search: ReturnType<typeof createDocSemanticSearchTool>;
  doc_compose: ReturnType<typeof createDocComposeTool>;
  e2b_python_sandbox: ReturnType<typeof createE2bPythonSandboxTool>;
  web_search_exa: ReturnType<typeof createExaSearchTool>;
  web_crawl_exa: ReturnType<typeof createExaCrawlTool>;
  todo_list: ReturnType<typeof createTodoTool>;
  mark_todo: ReturnType<typeof createMarkTodoTool>;
  make_it_real: ReturnType<typeof createMakeItRealTool>;
  python_coding: ReturnType<typeof createPythonCodingTool>;
}
