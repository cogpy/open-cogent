import { IconButton } from '@afk/component';
import { CloseIcon, PresentationIcon } from '@blocksuite/icons/rc';
import { useState } from 'react';

import { DocEditor } from '@/components/doc-composer/doc-editor';
import { useDocPanelStore } from '@/store/doc-panel';
import { PresentationMode } from './presentation-mode';

/**
 * 文档面板组件，显示在聊天面板旁边
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

  // 如果处于演示模式，显示演示组件
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
      {/* 头部 */}
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
            title="进入演示模式"
          />
          <IconButton
            size="24"
            icon={<CloseIcon />}
            onClick={close}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>
      </div>

      {/* 文档内容 */}
      <div className="flex-1 overflow-auto rounded py-2 px-6">
        <DocEditor doc={currentDoc} readonly={true} />
      </div>
    </div>
  );
}
