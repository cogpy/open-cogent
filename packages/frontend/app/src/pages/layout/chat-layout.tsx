import { Button, Loading, ScrollableContainer } from '@afk/component';
import {
  AllDocsIcon,
  EditIcon,
  FileIcon,
  PageIcon,
} from '@blocksuite/icons/rc';
import { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useMatch } from 'react-router';

import { Cmdk } from '@/components/cmdk/cmdk';
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
        <div className={styles.listItemLabel}>{chat.title ?? 'New Chat'}</div>
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
  const { allItems, refresh, chats, initialized, loading } = useLibraryStore();
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
        <Cmdk className="my-2" />
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

      <ScrollableContainer className="px-2 flex-1 h-0">
        {/* Recent */}
        <section className="my-2">
          {initialized ? null : loading ? (
            <div className="px-2 text-text-secondary text-sm flex items-center gap-3">
              <Loading className="text-xl" />
              Loading history...
            </div>
          ) : null}
          {chats.length > 0 ? (
            <h3 className={cn(styles.sectionTitle, 'mb-1 mt-4', 'px-2')}>
              Recent
            </h3>
          ) : null}
          <ul className="flex flex-col gap-1">
            {chats.slice(0, 5).map(chat => (
              <ChatItem chat={chat} key={chat.sessionId} />
            ))}
            {chats.length > 5 ? (
              <Link to="/library?type=chats">
                <Button
                  className="ml-7 text-text-primary text-sm font-medium"
                  variant="plain"
                  style={{ width: 'fit-content' }}
                >
                  Show More
                </Button>
              </Link>
            ) : null}
          </ul>
        </section>
        {/* scroll area */}
        {collectedItems.length === 0 ? null : (
          <h3 className={cn(styles.sectionTitle, 'mb-2', 'pt-2 px-2', 'mt-2')}>
            Favorites
          </h3>
        )}
        <ul className="flex flex-col gap-1">
          {collectedItems.map(item => {
            if (item.type === 'chat') {
              return <ChatItem chat={item} key={item.sessionId} />;
            }
            if (item.type === 'doc') {
              return <DocItem doc={item} key={item.docId} />;
            }
            if (item.type === 'file') {
              return <FileItem file={item} key={item.fileId} />;
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
