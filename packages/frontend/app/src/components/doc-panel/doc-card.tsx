import { useState, useEffect } from 'react';
import { FileTextIcon } from '@blocksuite/icons/rc';
import type { Store } from '@blocksuite/affine/store';
import { snapshotHelper } from '@/components/doc-composer/snapshot-helper';
import { useDocPanelStore } from '@/store/doc-panel';

interface DocCardProps {
  /** 文档内容（markdown 格式） */
  content: string;
  /** 文档标题 */
  title?: string;
  /** 卡片描述 */
  description?: string;
}

/**
 * 可点击的文档卡片组件
 */
export function DocCard({
  content,
  title = 'Document',
  description,
}: DocCardProps) {
  const [doc, setDoc] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { openDoc } = useDocPanelStore();

  useEffect(() => {
    // 从 markdown 内容创建文档
    snapshotHelper
      .createStore(content)
      .then(store => {
        if (store) {
          setDoc(store);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [content]);

  const handleClick = () => {
    if (doc) {
      openDoc(doc, title);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-blue-300 dark:hover:border-blue-700"
    >
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
          <FileTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 内容预览 */}
      <div className="rounded-md bg-white/70 dark:bg-gray-900/30 p-3 border border-blue-100 dark:border-blue-800/50">
        {isLoading ? (
          <div className="text-gray-500 text-xs">Loading preview...</div>
        ) : (
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
            {content.slice(0, 150)}...
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="mt-3 text-xs text-blue-600/70 dark:text-blue-400/70">
        📄 Click to open in side panel
      </div>
    </div>
  );
}
