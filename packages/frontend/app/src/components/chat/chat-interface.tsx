import { Loading } from '@afk/component';
import { useEffect, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';

import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/pages/chats/renderers/message';
import type { ChatSessionState } from '@/store/copilot/types';

// Placeholder component for when no session exists
interface ChatPlaceholderProps {
  placeholder?: string;
  placeholderTitle?: string;
  onPlaceholderSend?: (input: string) => Promise<void>;
  isCreating?: boolean;
  message?: string;
}

const ChatPlaceholder = ({
  placeholder = 'What are your thoughts?',
  placeholderTitle = 'What can I help you with?',
  onPlaceholderSend,
  isCreating = false,
  message,
}: ChatPlaceholderProps) => {
  const [input, setInput] = useState(message ?? '');

  const onSend = async () => {
    if (!input.trim()) return;
    if (onPlaceholderSend) {
      await onPlaceholderSend(input);
      setInput('');
    }
  };

  useEffect(() => {
    if (message) onSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col justify-center h-full p-4 gap-4 max-w-[900px] mx-auto">
      <div className="text-[26px] font-medium text-center mb-9">
        {placeholderTitle}
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        sending={isCreating}
        placeholder={placeholder}
      />
    </div>
  );
};

// Session component for when a session exists
interface ChatSessionProps {
  store: StoreApi<ChatSessionState>;
  placeholder?: string;
  showDocumentContext?: boolean;
  documentTitle?: string;
  className?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

const ChatSession = ({
  store,
  placeholder = 'What are your thoughts?',
  showDocumentContext = false,
  documentTitle,
  className = '',
  headerContent,
  footerContent,
}: ChatSessionProps) => {
  const messages = useStore(store, s => s.messages);
  const isSubmitting = useStore(store, s => s.isSubmitting);
  const isStreaming = useStore(store, s => s.isStreaming);
  const isLoading = useStore(store, s => s.isLoading);

  const [input, setInput] = useState('');

  const onSend = async () => {
    if (!input.trim()) return;
    await store.getState().sendMessage({ content: input });
    setInput('');
  };

  const containerClasses = `flex flex-col h-full p-4 ${className}`;

  return (
    <div className={containerClasses}>
      {headerContent}

      <div className="flex-1 overflow-y-auto">
        {showDocumentContext && documentTitle && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Document Context
            </div>
            <div className="text-sm text-blue-800">{documentTitle}</div>
          </div>
        )}

        {messages.length === 0 && isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loading size={24} />
          </div>
        ) : (
          <div className="max-w-[900px] mx-auto w-full">
            {messages.map((m, idx) => (
              <MessageRenderer
                key={m.id ?? idx}
                message={m}
                isStreaming={isStreaming && idx === messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-[900px] mx-auto w-full py-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={onSend}
          sending={isSubmitting}
          store={store}
          placeholder={placeholder}
        />
      </div>

      {footerContent}
    </div>
  );
};

export interface ChatInterfaceProps {
  store?: StoreApi<ChatSessionState>;
  placeholder?: string;
  showDocumentContext?: boolean;
  documentTitle?: string;
  className?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  // For placeholder mode when no store is provided
  placeholderTitle?: string;
  onPlaceholderSend?: (input: string) => Promise<void>;
  isCreating?: boolean;
  message?: string;
}

/**
 * Generic chat interface component that can be used in different contexts
 */
export const ChatInterface = ({
  store,
  placeholder = 'What are your thoughts?',
  showDocumentContext = false,
  documentTitle,
  className = '',
  headerContent,
  footerContent,
  placeholderTitle = 'What can I help you with?',
  onPlaceholderSend,
  isCreating = false,
  message,
}: ChatInterfaceProps) => {
  // If no store is provided, render the placeholder component
  if (!store) {
    return (
      <ChatPlaceholder
        placeholder={placeholder}
        placeholderTitle={placeholderTitle}
        onPlaceholderSend={onPlaceholderSend}
        isCreating={isCreating}
        message={message}
      />
    );
  }

  // If store is provided, render the session component
  return (
    <ChatSession
      store={store}
      placeholder={placeholder}
      showDocumentContext={showDocumentContext}
      documentTitle={documentTitle}
      className={className}
      headerContent={headerContent}
      footerContent={footerContent}
    />
  );
};
