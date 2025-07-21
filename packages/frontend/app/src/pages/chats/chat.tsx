import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { type StoreApi, useStore } from 'zustand';

import { ChatInput } from '@/components/chat-input';
import { useRefCounted } from '@/lib/hooks/use-ref-counted';
import { copilotClient } from '@/store/copilot/client';
import { chatSessionsStore } from '@/store/copilot/sessions-instance';
import type { ChatSessionState } from '@/store/copilot/types';

import { MessageRenderer } from './renderers/message';

const ChatPageImpl = ({
  store,
}: {
  store: StoreApi<ChatSessionState>;
  referencedDocId?: string;
}) => {
  const messages = useStore(store, s => s.messages);
  const isSubmitting = useStore(store, s => s.isSubmitting);
  const isStreaming = useStore(store, s => s.isStreaming);

  const [input, setInput] = useState('');

  const onSend = async () => {
    if (!input.trim()) return;
    // placeholder: backend expects specific options shape
    await store.getState().sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col justify-center h-full p-4 gap-4 max-w-[900px] mx-auto">
      <div className="flex-1 overflow-auto rounded p-2 flex flex-col gap-2">
        {messages.map((m, idx) => {
          return (
            <MessageRenderer
              key={m.id ?? idx}
              message={m}
              isStreaming={isStreaming && idx === messages.length - 1}
            />
          );
        })}
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        sending={isSubmitting}
      />
    </div>
  );
};

export const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Input state shared between modes
  const [input, setInput] = useState('');

  /* ---------------- Existing-session mode ---------------- */
  const sessionStore = useRefCounted(
    id,
    () =>
      id
        ? chatSessionsStore.getState().acquire({
            sessionId: id,
            client: copilotClient,
          })
        : null,
    () => id && chatSessionsStore.getState().release(id)
  );

  // When sessionStore becomes available, clear input local state so ChatPageImpl controls it
  useEffect(() => {
    if (sessionStore) {
      setInput('');
    }
  }, [sessionStore]);

  /* ---------------- Placeholder mode handlers ---------------- */
  const [isCreating, setIsCreating] = useState(false);

  const onSendPlaceholder = async () => {
    if (!input.trim() || isCreating) return;
    setIsCreating(true);
    try {
      // Create backend session first
      const newSessionId = await chatSessionsStore.getState().createSession({
        client: copilotClient,
        options: {
          promptName: 'Chat With AFFiNE AI', // default prompt
        },
      });

      // Send the first message via the newly created store
      const newStore =
        chatSessionsStore.getState().get(newSessionId) ??
        chatSessionsStore.getState().acquire({
          sessionId: newSessionId,
          client: copilotClient,
        });

      await newStore.getState().sendMessage({ content: input.trim() });

      // Navigate to URL with new session id
      navigate('/chats/' + newSessionId, { replace: true });
    } finally {
      setIsCreating(false);
    }
  };

  /* ---------------- Rendering ---------------- */
  if (id && sessionStore) {
    // Existing / newly created session mode
    return <ChatPageImpl store={sessionStore} />;
  }

  // Placeholder mode – no session yet
  return (
    <div className="flex flex-col justify-center h-full p-4 gap-4 max-w-[900px] mx-auto">
      <div className="text-[26px] font-medium text-center mb-9">
        What can I help you with?
      </div>
      <ChatInput input={input} setInput={setInput} onSend={onSendPlaceholder} />
    </div>
  );
};
