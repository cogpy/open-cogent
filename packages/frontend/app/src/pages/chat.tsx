import { Button } from '@afk/component';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useStore } from 'zustand';

import { useRefCounted } from '@/lib/hooks/use-ref-counted';
import { copilotClient } from '@/store/copilot/client';
import { chatSessionsStore } from '@/store/copilot/sessions-instance';

export const ChatPage = () => {
  const { id = 'default' } = useParams();

  const sessionStore = useRefCounted(
    id,
    () =>
      chatSessionsStore.getState().acquire({
        sessionId: id,
        workspaceId: 'mock-workspace',
        client: copilotClient,
      }),
    () => chatSessionsStore.getState().release(id)
  );

  const messages = useStore(
    sessionStore ??
      chatSessionsStore.getState().acquire({
        sessionId: id,
        workspaceId: 'mock-workspace',
        client: copilotClient,
      }),
    s => s.messages
  );
  const isSubmitting = useStore(
    sessionStore ??
      chatSessionsStore.getState().acquire({
        sessionId: id,
        workspaceId: 'mock-workspace',
        client: copilotClient,
      }),
    s => s.isSubmitting
  );

  const [input, setInput] = useState('');

  const onSend = async () => {
    if (!input.trim()) return;
    // placeholder: backend expects specific options shape
    await sessionStore?.getState().sendMessage({ content: input } as any);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex-1 overflow-auto border rounded p-2 flex flex-col gap-2">
        {messages.map(m => (
          <div
            key={m.id ?? Math.random()}
            className={m.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          value={input}
          placeholder="Type a message..."
          onChange={e => setInput(e.currentTarget.value)}
          className="flex-1"
          rows={2}
        />
        <Button onClick={onSend} disabled={isSubmitting || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};
