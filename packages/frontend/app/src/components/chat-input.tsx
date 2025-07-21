import { Button, IconButton } from '@afk/component';
import {
  ArrowDownSmallIcon,
  ArrowUpBigIcon,
  PlusIcon,
} from '@blocksuite/icons/rc';
import { useCallback } from 'react';

import { cn } from '@/lib/utils';

import * as styles from './chat-input.css';

export const ChatInput = ({
  input,
  setInput,
  onSend,
  placeholder = 'What are your thoughts?',
  sending,
  onAbort,
}: {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  placeholder?: string;
  sending?: boolean;
}) => {
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const maxHeight = 120;
      const target = e.currentTarget;
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
      target.style.overflowY = 'auto';

      setInput(e.currentTarget.value);
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isEmpty = e.currentTarget.value.trim() === '';

      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (!isEmpty) {
          e.currentTarget.blur();
          onSend();
        }
      }
    },
    [onSend]
  );

  return (
    <div className={cn(styles.container, 'border rounded-2xl p-4')}>
      <textarea
        rows={2}
        className="w-full resize-none bg-transparent focus:outline-none"
        value={input}
        placeholder={placeholder}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <footer className="flex items-center justify-between mt-2">
        <IconButton icon={<PlusIcon />} />

        <div className="flex items-center gap-2">
          <Button className={styles.modelSelector} variant="plain">
            <div className="flex items-center gap-1">
              Claude
              <ArrowDownSmallIcon className="text-xl" />
            </div>
          </Button>
          <IconButton
            disabled={!input.trim()}
            className={styles.send}
            icon={<ArrowUpBigIcon className="text-white" />}
            onClick={onSend}
          />
        </div>
      </footer>
    </div>
  );
};
