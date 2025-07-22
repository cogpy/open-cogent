import { IconButton } from '@afk/component';
import { CloseIcon, PresentationIcon } from '@blocksuite/icons/rc';
import { useState } from 'react';

import { DocEditor } from '@/components/doc-composer/doc-editor';
import { useDocPanelStore } from '@/store/doc-panel';
import { PresentationMode } from './presentation-mode';

/**
 * Document panel component, displayed next to the chat panel
 */
export function DocPanel() {
  const { isOpen, currentDoc, docTitle, close } = useDocPanelStore();
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  if (!isOpen || !currentDoc) {
    return null;
  }

  const handleStartPresentation = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  // If in presentation mode, show presentation component
  if (isPresentationMode) {
    return (
      <PresentationMode
        doc={currentDoc}
        title={docTitle}
        onClose={handleClosePresentation}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between p-2 rounded">
        <h2 className="text-lg font-medium text-gray-900 truncate">
          {docTitle}
        </h2>
        <div className="flex items-center gap-2">
          <IconButton
            size="24"
            icon={<PresentationIcon />}
            onClick={handleStartPresentation}
            className="text-gray-500 hover:text-blue-600"
            title="Enter presentation mode"
          />
          <IconButton
            size="24"
            icon={<CloseIcon />}
            onClick={close}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-auto rounded py-2 px-6">
        <DocEditor doc={currentDoc} readonly={true} />
      </div>
    </div>
  );
}
