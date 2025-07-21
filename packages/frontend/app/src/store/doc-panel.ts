import { create } from 'zustand';
import type { Store } from '@blocksuite/affine/store';

interface DocPanelState {
  /** 是否显示文档面板 */
  isOpen: boolean;
  /** 当前显示的文档 */
  currentDoc: Store | null;
  /** 文档标题 */
  docTitle: string;
  /** 打开文档面板并显示指定文档 */
  openDoc: (doc: Store, title?: string) => void;
  /** 关闭文档面板 */
  close: () => void;
}

export const useDocPanelStore = create<DocPanelState>(set => ({
  isOpen: false,
  currentDoc: null,
  docTitle: '',
  openDoc: (doc, title = 'Document') => {
    set({
      isOpen: true,
      currentDoc: doc,
      docTitle: title,
    });
  },
  close: () => {
    set({
      isOpen: false,
      currentDoc: null,
      docTitle: '',
    });
  },
}));
