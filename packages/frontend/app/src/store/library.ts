import { type CopilotHistories, getCopilotHistoriesQuery } from '@afk/graphql';
import { create } from 'zustand';

import { gql } from '@/lib/gql';

// mock data
const chats = Array.from({ length: 100 }, (_, i) => ({
  id: `chat-${i}`,
  title: `Test Chat ${i}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    collected: Math.random() > 0.8,
  },
}));
const docs = Array.from({ length: 100 }, (_, i) => ({
  id: `doc-${i}`,
  title: `Test Doc ${i}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    collected: Math.random() > 0.8,
  },
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
  metadata: {
    collected: Math.random() > 0.8,
  },
}));

export interface LibraryState {
  chats: any[];
  docs: any[];
  files: any[];
  allItems: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  chatsMap: Record<string, any>;
  docsMap: Record<string, any>;
  filesMap: Record<string, any>;
}

export const useLibraryStore = create<LibraryState>()(set => ({
  loading: false,
  chats: [],
  docs: [],
  files: [],
  allItems: [],
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
      set({
        allItems: [
          ...docs.map(doc => ({ type: 'doc', ...doc })),
          ...chats.map(chat => ({ type: 'chat', ...chat })),
          ...files.map(file => ({ type: 'file', ...file })),
        ].sort((a, b) => {
          return (
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime()
          );
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));
