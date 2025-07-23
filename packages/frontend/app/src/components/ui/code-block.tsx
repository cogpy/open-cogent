import { IconButton } from '@afk/component';
import { ExpandCloseIcon, ExpandFullIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useState } from 'react';

import { useHighlightedCode } from '../../lib/hooks/use-highlighted-code';

export const CodeBlock = ({
  children,
  language,
}: {
  children: React.ReactNode;
  language: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const html = useHighlightedCode(children as string, language);

  return (
    <div className="custom-code-block w-full rounded-xl border not-prose overflow-hidden">
      <header
        className="flex items-center justify-between border-b-[0.5px] h-12 px-4"
        style={{ backgroundColor: cssVarV2('toast/overlay/secondary') }}
      >
        <div className="text-sm text-text-secondary ">{language}</div>
        <IconButton
          icon={expanded ? <ExpandCloseIcon /> : <ExpandFullIcon />}
          onClick={() => setExpanded(!expanded)}
        />
      </header>
      <div
        className="p-4 text-[13px] overflow-auto"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          maxHeight: expanded ? 'none' : '400px',
        }}
      />
    </div>
  );
};
