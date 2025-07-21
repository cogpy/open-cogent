import {
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  RowInput,
} from '@afk/component';
import {
  ArrowDownSmallIcon,
  ArrowUpBigIcon,
  AttachmentIcon,
  CloseIcon,
  FileIcon,
  PageIcon,
  PlusIcon,
  SearchIcon,
} from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ChatIcon } from '@/icons/chat';
import { cn } from '@/lib/utils';
import { useLibraryStore } from '@/store/library';

import * as styles from './chat-input.css';

const tempModels = [
  'claude-sonnet-4@20250514',
  'claude-opus-4@20250514',
  'claude-3-7-sonnet@20250219',
  'claude-3-5-sonnet-v2@20241022',
  'gpt-4.1',
  'o3',
  'o4-mini',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

export type ChatContextChat = {
  type: 'chat';
  id: string;
};
export type ChatContextDoc = {
  type: 'doc';
  id: string;
};
export type ChatContextFile = {
  type: 'file';
  id: string;
};
export type ChatContextAttachment = {
  type: 'attachment';
  id: string;
  blob: File;
};

export type ChatContext =
  | ChatContextChat
  | ChatContextDoc
  | ChatContextFile
  | ChatContextAttachment;

const ModelSelectorMenu = ({
  model,
  setModel,
  children,
}: {
  children: React.ReactNode;
  model: string;
  setModel: (model: string) => void;
}) => {
  return (
    <Menu
      items={tempModels.map(m => (
        <MenuItem key={m} onClick={() => setModel(m)}>
          {m}
        </MenuItem>
      ))}
    >
      {children}
    </Menu>
  );
};

const ChatContextPreview = ({
  context,
  onRemove,
}: {
  context: ChatContextChat;
  onRemove: () => void;
}) => {
  const { chatsMap } = useLibraryStore();
  const chat = chatsMap[context.id];
  if (!chat) return null;

  return (
    <div className={styles.contextPreview}>
      <div className={styles.contextPreviewIcon}>
        <ChatIcon />
      </div>
      <div className={styles.contextPreviewTitle}>{chat.title}</div>
      <IconButton icon={<CloseIcon />} variant="plain" onClick={onRemove} />
    </div>
  );
};

const DocContextPreview = ({
  context,
  onRemove,
}: {
  context: ChatContextDoc;
  onRemove: () => void;
}) => {
  const { docsMap } = useLibraryStore();
  const doc = docsMap[context.id];
  if (!doc) return null;

  return (
    <div className={styles.contextPreview}>
      <div className={styles.contextPreviewIcon}>
        <PageIcon />
      </div>
      <div className={styles.contextPreviewTitle}>{doc.title}</div>
      <IconButton icon={<CloseIcon />} variant="plain" onClick={onRemove} />
    </div>
  );
};

const FileContextPreview = ({
  context,
  onRemove,
}: {
  context: ChatContextFile;
  onRemove: () => void;
}) => {
  const { filesMap } = useLibraryStore();
  const file = filesMap[context.id];
  if (!file) return null;

  return (
    <div className={styles.contextPreview}>
      <div className={styles.contextPreviewIcon}>
        <FileIcon />
      </div>
      <div className={styles.contextPreviewTitle}>{file.fileName}</div>
      <IconButton icon={<CloseIcon />} variant="plain" onClick={onRemove} />
    </div>
  );
};

const ContextSelectorMenu = ({
  contexts,
  setContexts,
  children,
}: {
  children: React.ReactNode;
  contexts: ChatContext[];
  setContexts: (contexts: ChatContext[]) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { docs, files, chats } = useLibraryStore();

  const [search, setSearch] = useState('');
  const [filteredDocs, setFilteredDocs] = useState(docs);
  const [filteredFiles, setFilteredFiles] = useState(files);
  const [filteredChats, setFilteredChats] = useState(chats);

  useEffect(() => {
    startTransition(() => {
      setFilteredDocs(
        docs.filter(doc =>
          doc.title.toLowerCase().includes(search.toLowerCase())
        )
      );
      setFilteredFiles(
        files.filter(file =>
          file.fileName.toLowerCase().includes(search.toLowerCase())
        )
      );
      setFilteredChats(
        chats.filter(
          chat =>
            chat.title &&
            chat.title.toLowerCase().includes(search.toLowerCase())
        )
      );
    });
  }, [chats, docs, files, search]);

  const handleAdd = (updates: ChatContext[] | ChatContext) => {
    const targets = Array.isArray(updates) ? updates : [updates];
    const newContexts = [...contexts];

    for (const target of targets) {
      const index = newContexts.findIndex(c => c.id === target.id);
      if (index === -1) {
        newContexts.push(target);
      } else {
        newContexts[index] = target;
      }
    }

    setContexts(newContexts);
  };

  return (
    <Menu
      contentOptions={{ style: { padding: 0 } }}
      items={
        <div className="max-h-[400px] max-w-[280px] overflow-y-auto rounded-lg">
          {/* Search */}
          <div
            className="px-1 py-2 pl-3 w-full min-w-[200px] gap-[6px] flex items-center border-b bg-white sticky top-0"
            style={{ borderWidth: 0.5 }}
          >
            <SearchIcon
              className="text-xl w-5 h-5 shrink-0"
              style={{ color: cssVarV2.icon.primary }}
            />
            <RowInput
              className="w-full h-[30px] focus:outline-none"
              placeholder="Search"
              value={search}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              onChange={setSearch}
            />
          </div>

          {/* Chats */}
          {filteredChats.length === 0 ? null : (
            <div className="flex flex-col gap-[2px] px-2">
              <div className={styles.groupLabel}>Chats</div>
              {filteredChats.map(chat => {
                return (
                  <MenuItem
                    onClick={() =>
                      handleAdd({ type: 'chat', id: chat.sessionId })
                    }
                    key={chat.sessionId}
                    prefixIcon={<ChatIcon />}
                  >
                    {chat.title}
                  </MenuItem>
                );
              })}
            </div>
          )}

          {/* Docs */}
          {filteredDocs.length === 0 ? null : (
            <>
              {filteredChats.length ? <Divider size="thinner" /> : null}
              <div className="flex flex-col gap-[2px] px-2">
                <div className={styles.groupLabel}>Docs</div>
                {filteredDocs.map(doc => {
                  return (
                    <MenuItem
                      onClick={() => handleAdd({ type: 'doc', id: doc.docId })}
                      key={doc.docId}
                      prefixIcon={<PageIcon />}
                    >
                      {doc.title}
                    </MenuItem>
                  );
                })}
              </div>
            </>
          )}

          {/* Files */}
          {filteredFiles.length === 0 ? null : (
            <>
              {filteredDocs.length || filteredChats.length ? (
                <Divider size="thinner" />
              ) : null}
              <div className="flex flex-col gap-[2px] px-2">
                <div className={styles.groupLabel}>Files</div>
                {filteredFiles.map(file => {
                  return (
                    <MenuItem
                      onClick={() =>
                        handleAdd({ type: 'file', id: file.fileId })
                      }
                      key={file.fileId}
                      prefixIcon={<FileIcon />}
                    >
                      {file.fileName}
                    </MenuItem>
                  );
                })}
              </div>
            </>
          )}

          {/* Empty state */}
          {filteredDocs.length === 0 &&
          filteredFiles.length === 0 &&
          filteredChats.length === 0 ? (
            <div className="flex flex-col gap-[2px] px-2 py-2 text-center">
              <div className={styles.groupLabel}>No results</div>
            </div>
          ) : null}

          {/* Upload */}
          <div
            style={{ borderWidth: 0.5 }}
            className="h-[46px] border-t sticky bottom-0 bg-white px-2 flex items-center mt-2 relative"
          >
            <input
              type="file"
              multiple
              className="opacity-0 absolute size-full cursor-pointer"
              ref={fileInputRef}
              onChange={e => {
                const files = e.target.files;
                if (!files) return;
                const newContexts: ChatContextAttachment[] = [];
                for (const file of files) {
                  newContexts.push({
                    type: 'attachment',
                    id: Math.random().toString(36).substring(2, 15),
                    blob: file,
                  });
                }
                handleAdd(newContexts);
                e.target.value = '';
              }}
            />
            <MenuItem
              prefixIcon={<AttachmentIcon />}
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Add images & files
            </MenuItem>
          </div>
        </div>
      }
    >
      {children}
    </Menu>
  );
};

const AttachmentContextPreview = ({
  context,
  onRemove,
}: {
  context: ChatContextAttachment;
  onRemove: () => void;
}) => {
  const file = context.blob;
  const mineType = file.type;
  const fileName = file.name;

  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mineType.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImgUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return () => {};
  }, [file, mineType]);

  if (imgUrl) {
    return (
      <div className="w-10 h-10 relative group">
        <img
          src={imgUrl}
          alt="Attachment"
          className="size-full object-cover rounded-md"
        />

        <div
          className={cn(
            'absolute size-4 rounded-xs bg-white border border-gray-200 flex items-center justify-center -top-2 -right-2 cursor-pointer',
            // show when hover
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={onRemove}
        >
          <CloseIcon />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contextPreview}>
      <div className={styles.contextPreviewIcon}>
        <FileIcon />
      </div>
      <div className={styles.contextPreviewTitle}>{fileName}</div>
      <IconButton icon={<CloseIcon />} variant="plain" onClick={onRemove} />
    </div>
  );
};

const ContextPreview = ({
  contexts,
  setContexts,
}: {
  contexts: ChatContext[];
  setContexts: (contexts: ChatContext[]) => void;
}) => {
  if (!contexts.length) return null;

  const handleRemove = (id: string) => {
    setContexts(contexts.filter(c => c.id !== id));
  };

  return (
    <div className="w-full flex items-center gap-3 overflow-x-auto mb-2 pb-2 pt-4 -mt-4">
      {contexts.map(context => {
        switch (context.type) {
          case 'chat':
            return (
              <ChatContextPreview
                context={context}
                onRemove={() => handleRemove(context.id)}
              />
            );
          case 'doc':
            return (
              <DocContextPreview
                context={context}
                onRemove={() => handleRemove(context.id)}
              />
            );
          case 'file':
            return (
              <FileContextPreview
                context={context}
                onRemove={() => handleRemove(context.id)}
              />
            );
          case 'attachment':
            return (
              <AttachmentContextPreview
                context={context}
                onRemove={() => handleRemove(context.id)}
              />
            );
        }
      })}
    </div>
  );
};

export const ChatInput = ({
  input,
  setInput,
  onSend,
  placeholder = 'What are your thoughts?',
  sending,
  onAbort,
  contexts,
  setContexts,
}: {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  placeholder?: string;
  sending?: boolean;
  contexts: ChatContext[];
  setContexts: (contexts: ChatContext[]) => void;
}) => {
  // const [model, setModel] = useState('claude-3-5-sonnet-v2@20241022');
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const maxHeight = 120;
      const target = e.currentTarget;
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
      target.style.overflowY = 'auto';

      setInput(e.currentTarget.value);
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isEmpty = e.currentTarget.value.trim() === '';

      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (!isEmpty) {
          e.currentTarget.blur();
          onSend();
        }
      }
    },
    [onSend]
  );

  return (
    <div className={cn(styles.container, 'border rounded-2xl p-4')}>
      <ContextPreview contexts={contexts} setContexts={setContexts} />
      <textarea
        rows={2}
        className="w-full resize-none bg-transparent focus:outline-none"
        value={input}
        placeholder={placeholder}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <footer className="flex items-center justify-between mt-2">
        <ContextSelectorMenu contexts={contexts} setContexts={setContexts}>
          <IconButton icon={<PlusIcon />} />
        </ContextSelectorMenu>

        <div className="flex items-center gap-2">
          {/* <ModelSelectorMenu model={model} setModel={setModel}>
            <Button className={styles.modelSelector} variant="plain">
              <div className="flex items-center gap-1">
                {model}
                <ArrowDownSmallIcon className="text-xl" />
              </div>
            </Button>
          </ModelSelectorMenu> */}
          <IconButton
            disabled={!input.trim()}
            className={styles.send}
            icon={<ArrowUpBigIcon className="text-white" />}
            onClick={onSend}
          />
        </div>
      </footer>
    </div>
  );
};
