import type { StreamObject } from '@afk/graphql';
import { cssVarV2 } from '@blocksuite/affine-shared/theme';
import { CheckBoxCheckSolidIcon } from '@blocksuite/icons/rc';
import { useRef } from 'react';

import { MarkdownText } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';

import { GenericToolResult } from './generic-tool-result';

export const ComputerUseCCResultCard = ({
  result,
}: {
  result: StreamObject['result'];
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!result) return null;

  const content = (
    <div className="px-4 max-h-150 overflow-y-auto">
      <div ref={contentRef} className={cn('max-w-none my-2')}>
        <MarkdownText
          text={result.output}
          className="prose prose-sm text-[13px]"
          style={{
            color: cssVarV2.text.secondary,
          }}
        />
      </div>
    </div>
  );

  return (
    <GenericToolResult
      title={'Claude Code result'}
      icon={<CheckBoxCheckSolidIcon />}
    >
      {content}
    </GenericToolResult>
  );
};
