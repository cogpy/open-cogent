import { Button, ScrollableContainer } from '@afk/component';
import { BookmarkIcon, PlusIcon } from '@blocksuite/icons/rc';
import { Link, Outlet } from 'react-router';

import { UserInfo } from '@/components/sidebar/user-info';

import * as styles from './chat-layout.css';
import { SidebarLayout } from './sidebar-layout';

const mockSessions = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `TODO: Session ${i}`,
  description: `Description ${i}`,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const SidebarContent = () => {
  return (
    <div className="size-full">
      {/* not scroll area */}
      <div
        style={{
          padding: '0px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <UserInfo />
        <Link to="/chats">
          <li className={styles.hoverableItem}>
            <PlusIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>New Chat</div>
          </li>
        </Link>
        <Link to="/library">
          <li className={styles.hoverableItem}>
            <BookmarkIcon className={styles.hoverableIcon} />
            <div className={styles.hoverableLabel}>Library</div>
          </li>
        </Link>
      </div>

      {/* scroll area */}
      <ScrollableContainer className="flex-1 h-0">
        <ul style={{ padding: '12px' }}>
          {mockSessions.map(session => (
            <Link to={`/chats/${session.id}`} key={session.id}>
              <Button style={{ width: '100%' }} variant="plain">
                <div
                  className="flex"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    gap: 4,
                  }}
                >
                  <div>{session.name}</div>
                  <div>{session.description}</div>
                </div>
              </Button>
            </Link>
          ))}
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
