import { ScrollableContainer } from '@afk/component';
import {
  AllDocsIcon,
  EditIcon,
  FileIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import { useEffect, useMemo } from 'react';
import { Link, Outlet } from 'react-router';

import { UserInfo } from '@/components/sidebar/user-info';
import { ChatIcon } from '@/icons/chat';
import { cn } from '@/lib/utils';
import {
  type Chat,
  type Doc,
  type File,
  useLibraryStore,
} from '@/store/library';

import * as styles from './chat-layout.css';
import { SidebarLayout } from './sidebar-layout';

const filterCollected = (items: any[]) =>
  items.filter(item => item?.metadata?.collected);

const ChatItem = ({ chat }: { chat: Chat }) => {
  return (
    <li className={styles.listItem}>
      <ChatIcon className={styles.listItemIcon} />
      <div className={styles.listItemLabel}>{chat.title}</div>
    </li>
  );
};

const DocItem = ({ doc }: { doc: Doc }) => {
  return (
    <li className={styles.listItem}>
      <PageIcon className={styles.listItemIcon} />
      <div className={styles.listItemLabel}>{doc.title}</div>
    </li>
  );
};

const FileItem = ({ file }: { file: File }) => {
  return (
    <li className={styles.listItem}>
      <FileIcon className={styles.listItemIcon} />
      <div className={styles.listItemLabel}>{file.fileName}</div>
    </li>
  );
};

const SidebarContent = () => {
  const { allItems, refresh } = useLibraryStore();
  const collectedItems = useMemo(() => filterCollected(allItems), [allItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="size-full flex flex-col">
      {/* not scroll area */}
      <div className="flex flex-col gap-1 px-2">
        <UserInfo />
        <Link to="/chats">
          <li className={styles.hoverableItem}>
            <EditIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>New Chat</div>
          </li>
        </Link>
        <Link to="/library">
          <li className={styles.hoverableItem}>
            <AllDocsIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>Library</div>
          </li>
        </Link>
      </div>

      {/* scroll area */}
      <h3 className={cn(styles.sectionTitle, 'mb-2', 'pt-2 px-4')}>
        Favorites
      </h3>
      <ScrollableContainer className="px-2 flex-1 h-0">
        {/* Chats */}
        {/* <section className="mb-2">
          <h3
            className={cn(styles.sectionTitle, 'mb-2')}
            onClick={() => setExpandChats(prev => !prev)}
          >
            Chats
            <ToggleDownIcon />
          </h3>
          {expandChats ? (
            <ul>
              {collectedChats.map(chat => (
                <ChatItem chat={chat} key={chat.id} />
              ))}
            </ul>
          ) : null}
        </section> */}
        <ul>
          {collectedItems.length === 0 ? (
            <span className="text-xs text-gray-400 px-2">No favorites yet</span>
          ) : null}
          {collectedItems.map(item => {
            if (item.type === 'chat') {
              return <ChatItem chat={item} key={item.id} />;
            }
            if (item.type === 'doc') {
              return <DocItem doc={item} key={item.id} />;
            }
            if (item.type === 'file') {
              return <FileItem file={item} key={item.id} />;
            }
            return null;
          })}
        </ul>
      </ScrollableContainer>
    </div>
  );
};

export const ChatLayout = () => {
  return (
    <SidebarLayout sidebar={<SidebarContent />}>
      <Outlet />
    </SidebarLayout>
  );
};
