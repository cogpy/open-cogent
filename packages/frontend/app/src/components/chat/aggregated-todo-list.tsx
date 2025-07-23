import { Loading } from '@afk/component';
import {
  SingleSelectCheckSolidIcon,
  SingleSelectUnIcon,
} from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useMemo } from 'react';
import { type StoreApi, useStore } from 'zustand';

import { cn } from '@/lib/utils';
import type { ChatSessionState } from '@/store/copilot/types';
import {
  extractAllTodosFromMessages,
  groupTodosByStatus,
} from '@/store/copilot/utils';

type CardStatus = 'done' | 'inProgress' | 'todo';

const statusToCardStatus = (status: string): CardStatus => {
  if (status === 'completed' || status === 'done') return 'done';
  if (
    status === 'in_progress' ||
    status === 'in-progress' ||
    status === 'processing'
  )
    return 'inProgress';
  return 'todo';
};

const getIcon = (status: CardStatus) => {
  switch (status) {
    case 'done':
      return <SingleSelectCheckSolidIcon />;
    case 'todo':
      return <SingleSelectUnIcon />;
    default:
      return <Loading size={24} />;
  }
};

interface AggregatedTodoListProps {
  store: StoreApi<ChatSessionState>;
}

export function AggregatedTodoList({ store }: AggregatedTodoListProps) {
  const messages = useStore(store, s => s.messages);

  const aggregatedTodos = useMemo(() => {
    // sort by status
    // progression > todo > done
    const todos = extractAllTodosFromMessages(messages);
    const grouped = groupTodosByStatus(todos);
    return [...grouped.inProgress, ...grouped.todo, ...grouped.done];
  }, [messages]);

  const totalTodos = aggregatedTodos.length;

  if (totalTodos === 0) {
    return null;
  }

  return (
    <div className="border border-b-0 rounded-t-2xl border-gray-200 bg-gray-50/50 mx-4">
      <div className="max-w-[800px] mx-auto px-4 py-3 max-h-30 overflow-y-auto">
        {/* Todo list content */}
        <div className="flex flex-col gap-2">
          {aggregatedTodos.map(todo => (
            <TodoListItem
              key={todo.id}
              status={statusToCardStatus(todo.status)}
              title={todo.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const TodoListItem = ({
  status,
  title,
  subTitle,
}: {
  status: CardStatus;
  title: string;
  subTitle?: string;
}) => {
  const icon = getIcon(status);
  return (
    <div
      data-status={status}
      className={cn('h-5  flex items-center gap-3 text-sm')}
    >
      <div
        className={cn('shrink-0 text-2xl')}
        style={{ color: cssVarV2.icon.primary }}
      >
        {icon}
      </div>
      <div
        className={cn(
          'flex gap-1 font-medium',
          status === 'done' && `line-through text-gray-500`
        )}
      >
        <div className={cn('w-full truncate text-sm')}>{title}</div>
        {subTitle ? (
          <div className={cn('truncate text-xs')}>{subTitle}</div>
        ) : null}
      </div>
    </div>
  );
};
