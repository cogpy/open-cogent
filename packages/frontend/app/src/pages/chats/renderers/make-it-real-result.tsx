import { useState, useEffect } from 'react';
import { PageIcon, CopyIcon } from '@blocksuite/icons/rc';
import { snapshotHelper } from '@/components/doc-composer/snapshot-helper';
import { useDocPanelStore } from '@/store/doc-panel';
import type { Store } from '@blocksuite/affine/store';

interface MakeItRealResultProps {
  /** The enhanced content from make_it_real tool */
  content: string;
  /** Original markdown content for comparison */
  originalContent?: string;
}

/**
 * Specialized UI component for displaying make_it_real tool results.
 * Shows the enhanced content as a clickable card that opens in the document panel.
 */
export function MakeItRealResult({
  content,
  originalContent,
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
      onClick={handleCardClick}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center gap-3">
        {/* Document Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
          <PageIcon className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate">
            Make It Real Result
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Enhanced markdown content
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <CopyIcon className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
