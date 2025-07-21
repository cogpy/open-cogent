import {
  Button,
  Masonry,
  type MasonryGroup,
  type MasonryItem,
} from '@afk/component';
import { FileIcon, PageIcon } from '@blocksuite/icons/rc';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { ChatIcon } from '@/icons/chat';
import { cn } from '@/lib/utils';
import { useLibraryStore } from '@/store/library';
import { useSidebarStore } from '@/store/sidebar';

import * as styles from './library-dashboard.css';

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Chats', value: 'chats' },
  { label: 'Documents', value: 'docs' },
  { label: 'Attachments', value: 'files' },
];

const groupDate = (items: any[], dateField = 'updatedAt') => {
  return items.reduce(
    (acc, item) => {
      const date = dayjs(item[dateField]);
      if (date.isSame(dayjs(), 'day')) {
        acc.today.push(item);
        return acc;
      }
      if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
        acc.yesterday.push(item);
        return acc;
      }
      if (date.isSame(dayjs(), 'week')) {
        acc.thisWeek.push(item);
        return acc;
      }
      if (date.isSame(dayjs(), 'month')) {
        acc.thisMonth.push(item);
        return acc;
      }
      acc.older.push(item);
      return acc;
    },
    {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    }
  );
};

const DateGroupHeader: MasonryGroup['Component'] = ({ groupId, itemCount }) => {
  return (
    <div className={cn('bg-white', styles.dateGroupHeader)}>
      {groupId}
      <span className="mx-1">·</span>
      {itemCount}
    </div>
  );
};

const ChatListItem: MasonryItem['Component'] = ({ itemId }) => {
  const { chatsMap } = useLibraryStore();
  const chat = chatsMap[itemId];
  return (
    <div className={styles.listItem}>
      <div className={styles.listItemIcon}>
        <ChatIcon />
      </div>
      <div className={styles.listItemTitle}>{chat.title}</div>
      <div>TODO: actions</div>
    </div>
  );
};

const DocListItem: MasonryItem['Component'] = ({ itemId }) => {
  const { docsMap } = useLibraryStore();
  const doc = docsMap[itemId];
  return (
    <div className={styles.listItem}>
      <div className={styles.listItemIcon}>
        <PageIcon />
      </div>
      <div className={styles.listItemTitle}>{doc.title}</div>
      <div>TODO: actions</div>
    </div>
  );
};

const FileListItem: MasonryItem['Component'] = ({ itemId }) => {
  const { filesMap } = useLibraryStore();
  const file = filesMap[itemId];
  return (
    <div className={styles.listItem}>
      <div className={styles.listItemIcon}>
        <FileIcon />
      </div>
      <div className={styles.listItemTitle}>{file.title}</div>
      <div>TODO: actions</div>
    </div>
  );
};

const withType = <T extends object>(items: T[], type: string) => {
  return items.map(item => ({ ...item, _type: type }));
};

const getComponentByType = (type: string) =>
  type === 'chats'
    ? ChatListItem
    : type === 'docs'
      ? DocListItem
      : FileListItem;

export const LibraryDashboard = () => {
  const { open } = useSidebarStore();
  const { chats, docs, files, refresh } = useLibraryStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  let type = searchParams.get('type') ?? 'all';
  if (!categories.some(c => c.value === type)) {
    type = 'all';
  }

  const masonryItems = useMemo(() => {
    if (type === 'all') {
      const itemsWithType = [
        ...withType(chats, 'chats'),
        ...withType(docs, 'docs'),
        ...withType(files, 'files'),
      ];
      return Object.entries<any>(groupDate(itemsWithType))
        .filter(([_, items]) => items.length > 0)
        .map(([key, items]) => ({
          id: key,
          height: 24,
          Component: DateGroupHeader,
          items: items.map((item: any) => {
            return {
              id: item.id,
              height: 42,
              Component: getComponentByType(item._type),
            };
          }),
        }));
    }

    const list = type === 'chats' ? chats : type === 'docs' ? docs : files;
    return Object.entries<any>(groupDate(list))
      .filter(([_, items]) => items.length > 0)
      .map(([key, items]) => ({
        id: key,
        height: 24,
        Component: DateGroupHeader,
        items: items.map((item: any) => ({
          id: item.id,
          height: 42,
          Component: getComponentByType(type),
        })),
      }));
  }, [chats, docs, files, type]);

  const isEmpty = masonryItems.length === 0;

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="h-full flex flex-col">
      <header className="h-15 border-b px-6 flex items-center gap-4">
        <div
          style={{ paddingLeft: open ? 0 : 30 }}
          className="transition-all h-full flex items-center"
        >
          <span className={styles.library}>Library</span>
        </div>

        <ul className="flex items-center gap-2">
          {categories.map(c => (
            <li key={c.value}>
              <Button
                className={styles.btn}
                data-active={c.value === type}
                onClick={() => {
                  navigate(`/library?type=${c.value}`, { replace: true });
                }}
              >
                {c.label}
              </Button>
            </li>
          ))}
        </ul>
      </header>
      <main className="h-0 flex-1 pt-4">
        {isEmpty ? 'Empty' : ''}
        <Masonry
          items={masonryItems}
          virtualScroll
          columns={1}
          paddingX={12}
          gapY={4}
          groupHeaderGapWithItems={8}
        />
      </main>
    </div>
  );
};
