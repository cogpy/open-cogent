import { Loading, observeResize } from '@afk/component';
import { ArrowDownBigIcon } from '@blocksuite/icons/rc';
import { AnimatePresence, motion } from 'framer-motion';
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type StoreApi, useStore } from 'zustand';

import { ChatInput } from '@/components/chat-input';
import { cn } from '@/lib/utils';
import { MessageRenderer } from '@/pages/chats/renderers/message';
import type { ChatSessionState } from '@/store/copilot/types';

import { AggregatedTodoList } from './aggregated-todo-list';
import { ChatPlayback } from './chat-playback';
import { ChatScrollerProvider } from './use-chat-scroller';

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

  const onSend = useCallback(async () => {
    if (!input.trim()) return;
    if (onPlaceholderSend) {
      await onPlaceholderSend(input);
      setInput('');
    }
  }, [input, onPlaceholderSend]);

  useEffect(() => {
    if (message) onSend();
  }, [message, onSend]);

  return (
    <div className="flex flex-col justify-center h-full p-4 gap-4 max-w-[800px] mx-auto">
      <div className="text-[26px] font-medium text-center mb-9">
        {placeholderTitle}
      </div>
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        sending={isCreating}
        placeholder={placeholder}
        isCreating={isCreating}
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

const DownArrow = ({
  show,
  onClick,
  loading,
}: {
  show: boolean;
  onClick: () => void;
  loading: boolean;
}) => {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.14 }}
          className={cn(
            'absolute left-1/2 -translate-x-1/2 bottom-10 cursor-pointer',
            'bg-white border rounded-full size-9',
            'flex items-center justify-center'
          )}
          style={{
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
          }}
          onClick={onClick}
        >
          <ArrowDownBigIcon className="text-2xl text-icon-primary" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const ChatSession = ({
  store,
  placeholder = 'What are your thoughts?',
  showDocumentContext = false,
  documentTitle,
  className = '',
  headerContent,
  footerContent,
}: ChatSessionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useStore(store, s => s.messages);
  const isSubmitting = useStore(store, s => s.isSubmitting);
  const isStreaming = useStore(store, s => s.isStreaming);
  const isLoading = useStore(store, s => s.isLoading);

  const [input, setInput] = useState('');
  const [showDownArrow, setShowDownArrow] = useState(false);
  const onSend = async () => {
    if (!input.trim()) return;
    await store.getState().sendMessage({ content: input });
    setInput('');
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  };

  const containerClasses = `flex flex-col h-full ${className}`;

  // useEffect(() => {
  //   startTransition(() => {
  //     const scrollContainer = scrollContainerRef.current;
  //     if (!scrollContainer) return;

  //     const scrollHeight = scrollContainer.scrollHeight;
  //     const scrollTop = scrollContainer.scrollTop;

  //     const isAtBottom =
  //       scrollTop + scrollContainer.clientHeight >= scrollHeight;

  //     setShowDownArrow(!isAtBottom);
  //   });
  // }, [messages]);

  // useEffect(() => {
  //   const scrollContainer = scrollContainerRef.current;
  //   if (!scrollContainer) return;

  //   const handleScroll = () => {
  //     const scrollHeight = scrollContainer.scrollHeight;
  //     const scrollTop = scrollContainer.scrollTop;

  //     const isAtBottom =
  //       scrollTop + scrollContainer.clientHeight >= scrollHeight;

  //     setShowDownArrow(!isAtBottom);
  //   };

  //   scrollContainer.addEventListener('scroll', handleScroll);

  //   return () => {
  //     scrollContainer.removeEventListener('scroll', handleScroll);
  //   };
  // }, []);
  const checkIsBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return null;

    const scrollTop = scrollContainer.scrollTop;
    const clientHeight = scrollContainer.clientHeight;
    const scrollHeight = scrollContainer.scrollHeight;

    const isAtBottom = scrollTop + clientHeight >= scrollHeight;

    startTransition(() => {
      setShowDownArrow(!isAtBottom);
    });
    return isAtBottom;
  }, []);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    checkIsBottom();
    return observeResize(messagesContainerRef.current, checkIsBottom);
  }, [checkIsBottom]);

  return (
    <div className={containerClasses}>
      {headerContent}

      <div className="flex-1 h-0 flex flex-col relative">
        <ChatScrollerProvider
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto py-4"
          onScroll={checkIsBottom}
        >
          <div className="w-full h-fit" ref={messagesContainerRef}>
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
              <div className="max-w-[800px] mx-auto w-full [&>*:not(:first-child)]:mt-4">
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
        </ChatScrollerProvider>

        <DownArrow
          show={showDownArrow}
          onClick={() => {
            scrollContainerRef.current?.scrollTo({
              top: scrollContainerRef.current?.scrollHeight,
              behavior: 'smooth',
            });
          }}
          loading={isStreaming}
        />
      </div>

      <div className="max-w-[800px] mx-auto w-full py-4">
        {/* Aggregated Todo List - positioned above input */}
        <AggregatedTodoList store={store} />
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
  /** When true, render messages progressively in read-only playback mode */
  playback?: boolean;
  /** Called once when playback starts */
  onPlaybackStart?: () => void;
  /** Called every time a new message is revealed */
  onPlaybackProgress?: (current: number, total: number) => void;
  /** Called once when playback reaches the final message */
  onPlaybackFinish?: () => void;
  skipPlayback?: boolean;
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
  playback = false,
  onPlaybackStart,
  onPlaybackProgress,
  onPlaybackFinish,
  skipPlayback = false,
  placeholderTitle = 'What can I help you with?',
  onPlaceholderSend,
  isCreating = false,
  message,
}: ChatInterfaceProps) => {
  // Playback mode: read-only incremental reveal
  if (playback && store) {
    return (
      <ChatPlayback
        store={store}
        className={className}
        headerContent={headerContent}
        footerContent={footerContent}
        showDocumentContext={showDocumentContext}
        documentTitle={documentTitle}
        onStart={onPlaybackStart}
        onProgress={onPlaybackProgress}
        onFinish={onPlaybackFinish}
        skip={skipPlayback}
      />
    );
  }
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
