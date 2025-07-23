import { RadioGroup } from '@afk/component';
import type { StreamObject } from '@afk/graphql';
import { FileIconHtmlIcon } from '@blocksuite/icons/rc';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import HtmlPreviewer from '@/components/html-previewer';
import { useHighlightedCode } from '@/lib/hooks/use-highlighted-code';
import { cn } from '@/lib/utils';

import * as styles from './code-artifact-result.css';
import { GenericToolResult } from './generic-tool-result';

export const CodeArtifactResult = ({
  result,
}: {
  result: StreamObject['result'];
}) => {
  const [view, setView] = useState<'Code' | 'Preview'>('Code');
  const [collapsed, setCollapsed] = useState(true);

  const { html, title } = result as { html: string; title: string };

  const highlightedHtml = useHighlightedCode(html, 'html');

  if (!result || !html) return null;

  return (
    <GenericToolResult
      title={title}
      icon={<FileIconHtmlIcon />}
      actions={
        <AnimatePresence>
          {collapsed ? null : (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <RadioGroup
                className="mr-3"
                items={['Code', 'Preview']}
                value={view}
                onChange={setView}
              />
            </motion.div>
          )}
        </AnimatePresence>
      }
      onCollapseChange={setCollapsed}
    >
      <div className={cn('relative', view === 'Preview' && 'h-150')}>
        <HtmlPreviewer
          code={html}
          className={cn(
            'size-full min-h-150 absolute',
            view === 'Code' ? 'opacity-0 pointer-events-none' : ''
          )}
        />
        {view === 'Code' ? (
          <div
            className={cn(
              styles.codeBlock,
              'not-prose max-h-150 overflow-y-auto',
              'relative z-1'
            )}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : null}
      </div>
    </GenericToolResult>
  );
};
