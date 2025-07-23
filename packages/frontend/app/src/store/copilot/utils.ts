import type { ChatMessage, MarkTodoArgs, TodoListItem } from './types';

export interface AggregatedTodoItem {
  id: string;
  title: string;
  status: string;
  description?: string;
  sourceMessageId: string | null;
  listId?: string;
}

/**
 * Extracts all todo items from all messages in a chat session
 */
export function extractAllTodosFromMessages(
  messages: ChatMessage[]
): AggregatedTodoItem[] {
  const todos: Map<string, AggregatedTodoItem> = new Map();

  for (const message of messages) {
    if (!message.streamObjects) continue;

    for (const streamObj of message.streamObjects) {
      if (
        streamObj.type === 'tool-result' &&
        streamObj.toolName === 'todo_list'
      ) {
        const list = streamObj.result?.list as unknown as TodoListItem[];
        const listId = streamObj.result?.id;

        if (list && listId) {
          for (const item of list) {
            // init todos:
            todos.set(item.id, {
              id: item.id,
              title: item.title,
              status: item.status,
              description: item.description,
              sourceMessageId: message.id,
              listId,
            });
          }
        }
      }

      if (
        streamObj.type === 'tool-result' &&
        streamObj.toolName === 'mark_todo'
      ) {
        const args = streamObj.args as unknown as MarkTodoArgs;
        const todoId = args.todoId;

        const todo = todos.get(todoId);
        if (todo) {
          todo.status = args.status;
        }
      }
    }
  }

  return Array.from(todos.values());
}

/**
 * Groups todos by status for display
 */
export function groupTodosByStatus(todos: AggregatedTodoItem[]) {
  const grouped: Record<'inProgress' | 'todo' | 'done', AggregatedTodoItem[]> =
    {
      inProgress: [],
      todo: [],
      done: [],
    };

  for (const item of todos) {
    if (item.status === 'completed' || item.status === 'done') {
      grouped.done.push(item);
    } else if (item.status === 'in_progress' || item.status === 'in-progress') {
      grouped.inProgress.push(item);
    } else {
      grouped.todo.push(item);
    }
  }

  return grouped;
}
