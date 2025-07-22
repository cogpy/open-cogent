import { ScrollableContainer } from '@afk/component';
import {
  AllDocsIcon,
  EditIcon,
  FileIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useMatch } from 'react-router';

// import { Cmdk } from '@/components/cmdk/cmdk';
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
  const match = useMatch(`/chats/${chat.sessionId}`);
  const isActive = Boolean(match);
  return (
    <Link to={`/chats/${chat.sessionId}`}>
      <li className={cn(styles.listItem, isActive && styles.activeItem)}>
        <ChatIcon className={styles.listItemIcon} />
        <div className={styles.listItemLabel}>{chat.title}</div>
      </li>
    </Link>
  );
};

const DocItem = ({ doc }: { doc: Doc }) => {
  const match = useMatch(`/library/${doc.docId}`);
  const isActive = Boolean(match);
  return (
    <Link to={`/library/${doc.docId}`}>
      <li className={cn(styles.listItem, isActive && styles.activeItem)}>
        <PageIcon className={styles.listItemIcon} />
        <div className={styles.listItemLabel}>{doc.title}</div>
      </li>
    </Link>
  );
};

const FileItem = ({ file }: { file: File }) => {
  const match = useMatch(`/library/${file.fileId}`);
  const isActive = Boolean(match);
  return (
    <Link to={`/library/${file.fileId}`}>
      <li className={cn(styles.listItem, isActive && styles.activeItem)}>
        <FileIcon className={styles.listItemIcon} />
        <div className={styles.listItemLabel}>{file.fileName}</div>
      </li>
    </Link>
  );
};

const SidebarContent = () => {
  const { allItems, refresh } = useLibraryStore();
  const collectedItems = useMemo(() => filterCollected(allItems), [allItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { pathname } = useLocation();
  const inChats = pathname === '/chats';
  const inLibrary = pathname.startsWith('/library');

  return (
    <div className="size-full flex flex-col">
      {/* not scroll area */}
      <div className="flex flex-col gap-1 px-2">
        <UserInfo />
        {/* <Cmdk className="my-2" /> */}
        <Link to="/chats">
          <li
            className={cn(styles.hoverableItem, inChats && styles.activeItem)}
          >
            <EditIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>New Chat</div>
          </li>
        </Link>
        <Link to="/library">
          <li
            className={cn(styles.hoverableItem, inLibrary && styles.activeItem)}
          >
            <AllDocsIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>Library</div>
          </li>
        </Link>
      </div>

      {/* scroll area */}
      {collectedItems.length === 0 ? null : (
        <h3 className={cn(styles.sectionTitle, 'mb-2', 'pt-2 px-4')}>
          Favorites
        </h3>
      )}
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
        <ul className="flex flex-col gap-1">
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

export const OALayout = () => {
  return (
    <SidebarLayout sidebar={<SidebarContent />}>
      <Outlet />
    </SidebarLayout>
  );
};
