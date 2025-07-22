import { CheckBoxCheckSolidIcon } from '@blocksuite/icons/rc';

import { MessageCard } from '@/components/ui/card/message-card';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  title: string;
  status: string;
  description?: string;
}

interface TodoListResultProps {
  /** Result object returned by the `todo_list` / `mark_todo` tool */
  result: {
    id?: string;
    list: TodoItem[];
  };
  className?: string;
}

const COLUMN_LABELS = {
  done: 'Done',
  inProgress: 'In progress',
  todo: 'Todo',
} as const;

const statusToCardStatus = (
  status: string
): 'success' | 'done' | 'loading' | 'loading-placeholder' => {
  switch (status) {
    case 'completed':
    case 'done':
      return 'done';
    case 'in_progress':
    case 'in-progress':
    case 'inProgress':
    case 'processing':
      return 'loading';
    case 'pending':
    case 'todo':
    default:
      return 'loading';
  }
};

const getIcon = (status: string) => {
  switch (status) {
    case 'done':
      return <CheckBoxCheckSolidIcon />;
    case 'pending':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9.25" stroke="#B3B3B3" strokeWidth="1.5" />
        </svg>
      );
    // processing & loading show spinner via MessageCard, no icon needed
    default:
      return undefined;
  }
};

const statusCategory = (status: string): keyof typeof COLUMN_LABELS => {
  switch (status) {
    case 'completed':
    case 'done':
      return 'done';
    case 'in_progress':
    case 'in-progress':
    case 'inProgress':
    case 'processing':
      return 'inProgress';
    case 'pending':
    case 'todo':
    default:
      return 'todo';
  }
};

export function TodoListResult({ result, className }: TodoListResultProps) {
  const grouped: Record<'done' | 'inProgress' | 'todo', TodoItem[]> = {
    done: [],
    inProgress: [],
    todo: [],
  };

  for (const item of result.list ?? []) {
    grouped[statusCategory(item.status)].push(item);
  }

  return (
    <div className={cn('', className)}>
      {/* Horizontal scroll wrapper */}
      <div className="overflow-x-auto">
        {/* Track: flex on mobile, grid on medium+ */}
        <div className="flex md:grid md:grid-cols-3 gap-4 min-w-max pb-2 max-h-[300px]">
          {/** Render each column */}
          {(
            Object.keys(COLUMN_LABELS) as Array<keyof typeof COLUMN_LABELS>
          ).map(key => {
            const items = grouped[key];
            return (
              <div
                key={key}
                className="flex-shrink-0 md:flex-shrink md:gap-2 flex flex-col gap-2 w-72"
              >
                <h3 className="text-sm font-medium text-gray-500">
                  {COLUMN_LABELS[key]}
                </h3>
                {items.length === 0 ? (
                  <span className="text-xs text-gray-400">-</span>
                ) : (
                  items.map(item => (
                    <MessageCard
                      key={item.id}
                      status={statusToCardStatus(item.status)}
                      title={item.title}
                      subTitle={item.description}
                      icon={getIcon(statusToCardStatus(item.status))}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
