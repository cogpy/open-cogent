import { IconButton } from '@afk/component';
import { CloseIcon } from '@blocksuite/icons/rc';
import { DocEditor } from '@/components/doc-composer/doc-editor';
import { useDocPanelStore } from '@/store/doc-panel';

/**
 * 文档面板组件，显示在聊天面板旁边
 */
export function DocPanel() {
  const { isOpen, currentDoc, docTitle, close } = useDocPanelStore();

  if (!isOpen || !currentDoc) {
    return null;
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* 头部 */}
      <div className="flex items-center justify-between p-2 rounded">
        <h2 className="text-lg font-medium text-gray-900 truncate">
          {docTitle}
        </h2>
        <IconButton
          size="24"
          icon={<CloseIcon />}
          onClick={close}
          className="text-gray-500 hover:text-gray-700"
        />
      </div>

      {/* 文档内容 */}
      <div className="flex-1 overflow-auto rounded p-2">
        <DocEditor doc={currentDoc} readonly={true} />
      </div>
    </div>
  );
}
