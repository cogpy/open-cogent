import type { StreamObject } from '@afk/graphql';
import { useEffect, useState } from 'react';
import { createHighlighter } from 'shiki';

import { FilePythonIcon } from '@/icons/file-python';
import { cn } from '@/lib/utils';

import { GenericToolResult } from './generic-tool-result';

export const PythonCodeResult = ({
  result,
}: {
  result: StreamObject['result'];
}) => {
  const [highlightedHtml, setHighlightedHtml] = useState('');

  const code = result as unknown as string;

  useEffect(() => {
    if (!code) return;

    async function highlightCode(code: string) {
      const highlighter = await createHighlighter({
        themes: ['min-light'],
        langs: ['python'],
      });

      const html = highlighter.codeToHtml(code, {
        lang: 'python',
        theme: 'min-light',
      });

      return html;
    }

    highlightCode(code).then(html => {
      if (!html) return;
      setHighlightedHtml(html);
    });
  }, [code]);

  if (!result || !code) return null;

  return (
    <GenericToolResult title={'Code generated'} icon={<FilePythonIcon />}>
      <div
        className={cn('not-prose max-h-150 overflow-y-auto px-10 py-4 text-xs')}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </GenericToolResult>
  );
};
