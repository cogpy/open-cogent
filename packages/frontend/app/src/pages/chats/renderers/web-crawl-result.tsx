import { EmbedWebIcon } from '@blocksuite/icons/rc';

import { GenericToolResult } from './generic-tool-result';
import { useWebResult } from './web-search-result';

export function WebCrawlResult({ results }: { results: any[] }) {
  const { resultCount, content } = useWebResult(results);

  return (
    <GenericToolResult
      icon={<EmbedWebIcon />}
      title={'Crawling completed'}
      count={resultCount}
    >
      {content}
    </GenericToolResult>
  );
}
