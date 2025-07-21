import {
  type GetCopilotHistoriesQuery,
  getCopilotHistoriesQuery,
  type GetUserDocsQuery,
  getUserDocsQuery,
  type GetUserFilesQuery,
  getUserFilesQuery,
} from '@afk/graphql';
import { create } from 'zustand';

import { gql } from '@/lib/gql';

export interface GenericLibraryMetadata {
  collected: boolean;
}
export interface ChatMetadata extends GenericLibraryMetadata {}
export interface DocMetadata extends GenericLibraryMetadata {}
export interface FileMetadata extends GenericLibraryMetadata {}

type MapMetadata<T, K extends GenericLibraryMetadata> = Omit<T, 'metadata'> & {
  metadata: K;
};

export type Chat = MapMetadata<
  NonNullable<
    GetCopilotHistoriesQuery['currentUser']
  >['copilot']['chats']['edges'][number]['node'],
  ChatMetadata
>;
export type Doc = MapMetadata<
  NonNullable<
    GetUserDocsQuery['currentUser']
  >['embedding']['docs']['edges'][number]['node'],
  DocMetadata
>;
export type File = MapMetadata<
  NonNullable<
    GetUserFilesQuery['currentUser']
  >['embedding']['files']['edges'][number]['node'],
  FileMetadata
>;

export type AllItem = Array<
  | ({
      type: 'chat';
    } & Chat)
  | ({
      type: 'doc';
    } & Doc)
  | ({
      type: 'file';
    } & File)
>;
export interface LibraryState {
  chats: Chat[];
  docs: Doc[];
  files: File[];
  allItems: AllItem[];
  loading: boolean;
  chatsMap: Record<string, Chat>;
  docsMap: Record<string, Doc>;
  filesMap: Record<string, File>;
  initialized: boolean;
  refresh: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  loading: false,
  initialized: false,
  chats: [],
  docs: [],
  files: [],
  allItems: [],
  chatsMap: {},
  docsMap: {},
  filesMap: {},
  refresh: async () => {
    if (get().loading) return;

    set({ loading: true });
    try {
      const [chatsRes, docsRes, filesRes] = await Promise.allSettled([
        gql({
          query: getCopilotHistoriesQuery,
          variables: {
            pagination: {
              first: 2 ** 10,
            },
          },
        }),
        gql({
          query: getUserDocsQuery,
          variables: {
            pagination: {
              first: 2 ** 10,
            },
          },
        }),
        gql({
          query: getUserFilesQuery,
          variables: {
            pagination: {
              first: 2 ** 10,
            },
          },
        }),
      ]);
      let docs: Doc[] = [],
        chats: Chat[] = [],
        files: File[] = [];
      if (chatsRes.status === 'fulfilled') {
        chats =
          chatsRes.value.currentUser?.copilot.chats.edges.map(edge => ({
            ...edge.node,
            metadata: JSON.parse(edge.node.metadata || '{}') as ChatMetadata,
          })) ?? [];
      }
      if (docsRes.status === 'fulfilled') {
        docs =
          docsRes.value.currentUser?.embedding.docs.edges.map(edge => ({
            ...edge.node,
            metadata: JSON.parse(edge.node.metadata || '{}') as DocMetadata,
          })) ?? [];
      }
      if (filesRes.status === 'fulfilled') {
        files =
          filesRes.value.currentUser?.embedding.files.edges.map(edge => ({
            ...edge.node,
            metadata: JSON.parse(edge.node.metadata || '{}') as FileMetadata,
          })) ?? [];
      }

      set({ docs, chats, files });
      set({
        chatsMap: chats.reduce((acc, chat) => {
          acc[chat.sessionId] = chat;
          return acc;
        }, {} as any),
        docsMap: docs.reduce((acc, doc) => {
          acc[doc.docId] = doc;
          return acc;
        }, {} as any),
        filesMap: files.reduce((acc, file) => {
          acc[file.fileId] = file;
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
            new Date((b as any).updatedAt ?? b.createdAt).getTime() -
            new Date((a as any).updatedAt ?? a.createdAt).getTime()
          );
        }) as unknown as AllItem[],
      });
      set({ initialized: true });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));
