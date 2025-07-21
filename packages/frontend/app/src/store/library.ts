import { type CopilotHistories, getCopilotHistoriesQuery } from '@afk/graphql';
import { create } from 'zustand';

import { gql } from '@/lib/gql';

// mock data
const chats = Array.from({ length: 100 }, (_, i) => ({
  id: `chat-${i}`,
  title: `Test Chat ${i}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
const docs = Array.from({ length: 100 }, (_, i) => ({
  id: `doc-${i}`,
  title: `Test Doc ${i}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
const files = Array.from({ length: 100 }, (_, i) => ({
  id: `file-${i}`,
  title: `Test File ${i}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mineType: [
    'application/pdf',
    'application/docx',
    'application/doc',
    'application/txt',
  ][Math.floor(Math.random() * 4)],
}));

export interface LibraryState {
  chats: any[];
  docs: any[];
  files: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  chatsMap: Record<string, any>;
  docsMap: Record<string, any>;
  filesMap: Record<string, any>;
}

export const useLibraryStore = create<LibraryState>()(set => ({
  loading: false,
  all: [],
  chats: [],
  docs: [],
  files: [],
  chatsMap: {},
  docsMap: {},
  filesMap: {},
  refresh: async () => {
    set({ loading: true });
    try {
      // const res = await gql({
      //   query: getCopilotHistoriesQuery,
      //   variables: {},
      // });
      set({ docs, chats, files });
      set({
        chatsMap: chats.reduce((acc, chat) => {
          acc[chat.id] = chat;
          return acc;
        }, {} as any),
        docsMap: docs.reduce((acc, doc) => {
          acc[doc.id] = doc;
          return acc;
        }, {} as any),
        filesMap: files.reduce((acc, file) => {
          acc[file.id] = file;
          return acc;
        }, {} as any),
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));
