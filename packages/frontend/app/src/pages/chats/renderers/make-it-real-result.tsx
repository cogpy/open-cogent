import { PageIcon } from '@blocksuite/icons/rc';

import { useOpenDocContext } from '@/contexts/doc-panel-context';
import { cn } from '@/lib/utils';

import { toolResult } from './tool.css';

interface MakeItRealResultProps {
  docId: string;
  title: string;
}

/**
 * Specialized UI component for displaying make_it_real tool results.
 * Shows the enhanced content as a clickable card that opens in the document panel.
 */
export function MakeItRealResult({ docId, title }: MakeItRealResultProps) {
  const { openDoc } = useOpenDocContext();

  const handleCardClick = () => {
    openDoc(docId);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors',
        toolResult
      )}
      onClick={handleCardClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 h-4 flex items-center">
            <PageIcon className="w-4 h-4 text-gray-400 text-xl" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
