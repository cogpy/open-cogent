import type { Store } from '@blocksuite/affine/store';
import { CopyIcon, PageIcon } from '@blocksuite/icons/rc';
import { useEffect, useState } from 'react';

import { snapshotHelper } from '@/components/doc-composer/snapshot-helper';
import { useDocPanelStore } from '@/store/doc-panel';

interface DocComposeResultProps {
  /** The generated content from doc_compose tool */
  content: string;
  /** Title of the document */
  title?: string;
  /** User prompt that was used to generate the document */
  userPrompt?: string;
}

/**
 * Specialized UI component for displaying doc_compose tool results.
 * Shows the generated document content as a clickable card that opens in the document panel.
 */
export function DocComposeResult({
  content,
  title,
  userPrompt,
}: DocComposeResultProps) {
  const [copied, setCopied] = useState(false);
  const [doc, setDoc] = useState<Store | null>(null);
  const { openDoc } = useDocPanelStore();

  useEffect(() => {
    // Create doc from generated content
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
      const docTitle = title || 'Generated Document';
      openDoc(doc, docTitle);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:border-gray-300"
    >
      <div className="flex items-center gap-3">
        {/* Document Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
          <PageIcon className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {title || 'Generated Document'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {userPrompt
              ? `Based on: ${userPrompt}`
              : 'AI-generated document content'}
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
