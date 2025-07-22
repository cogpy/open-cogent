import { create } from 'zustand';
import type { Store } from '@blocksuite/affine/store';

interface DocPanelState {
  /** Whether to show the document panel */
  isOpen: boolean;
  /** Currently displayed document */
  currentDoc: Store | null;
  /** Document title */
  docTitle: string;
  /** Open document panel and display specified document */
  openDoc: (doc: Store, title?: string) => void;
  /** Close document panel */
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
