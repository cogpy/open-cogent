import type { Store } from '@blocksuite/affine/store';
import { CopyIcon, PageIcon } from '@blocksuite/icons/rc';
import { useEffect, useState } from 'react';

import { snapshotHelper } from '@/components/doc-composer/snapshot-helper';
import { useDocPanelStore } from '@/store/doc-panel';

interface MakeItRealResultProps {
  /** The enhanced content from make_it_real tool */
  content: string;
  /** Original markdown content for comparison */
  originalContent?: string;
  /** User prompt that triggered the make it real action */
  userPrompt?: string;
}

/**
 * Specialized UI component for displaying make_it_real tool results.
 * Shows the enhanced content as a clickable card that opens in the document panel.
 */
export function MakeItRealResult({
  content,
  originalContent,
  userPrompt,
}: MakeItRealResultProps) {
  const [copied, setCopied] = useState(false);
  const [doc, setDoc] = useState<Store | null>(null);
  const { openDoc } = useDocPanelStore();

  useEffect(() => {
    // Create doc from enhanced content
    snapshotHelper.createStore(content).then(store => {
      if (store) {
        setDoc(store);
      }
    });
  }, [content]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleCardClick = () => {
    if (doc) {
      openDoc(doc, 'Make It Real - Enhanced Content');
    }
  };

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {/* Document Icon */}
          <div className="flex-shrink-0 mt-0.5 h-4 flex items-center">
            <PageIcon className="w-4 h-4 text-gray-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              Enhanced Markdown Content
            </div>
            {userPrompt && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {userPrompt}
              </p>
            )}
            {content && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                <div className="whitespace-pre-wrap line-clamp-6">
                  {content.length > 500
                    ? content.substring(0, 500) + '...'
                    : content}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <CopyIcon className="w-3 h-3" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
