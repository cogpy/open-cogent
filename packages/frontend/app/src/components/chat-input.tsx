import { IconButton, Menu, MenuItem } from '@afk/component';
import { ArrowUpBigIcon, PlusIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useCallback, useRef } from 'react';
import type { StoreApi } from 'zustand';

import { cn } from '@/lib/utils';
import type { ChatSessionState } from '@/store/copilot/types';

import { ContextPreview, ContextSelectorMenu } from './chat-context';
import * as styles from './chat-input.css';

const tempModels = [
  'claude-sonnet-4@20250514',
  'claude-opus-4@20250514',
  'claude-3-7-sonnet@20250219',
  'claude-3-5-sonnet-v2@20241022',
  'gpt-4.1',
  'o3',
  'o4-mini',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

const ModelSelectorMenu = ({
  model,
  setModel,
  children,
}: {
  children: React.ReactNode;
  model: string;
  setModel: (model: string) => void;
}) => {
  return (
    <Menu
      items={tempModels.map(m => (
        <MenuItem key={m} onClick={() => setModel(m)}>
          {m}
        </MenuItem>
      ))}
    >
      {children}
    </Menu>
  );
};

export const ChatInput = ({
  input,
  setInput,
  onSend,
  placeholder = 'What are your thoughts?',
  sending,
  onAbort,
  store,
  isCreating,
}: {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  placeholder?: string;
  sending?: boolean;
  store?: StoreApi<ChatSessionState>;
  isCreating?: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    textareaRef.current?.focus();
  }, []);

  // const [model, setModel] = useState('claude-3-5-sonnet-v2@20241022');
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
    <div
      onClick={onClick}
      className={cn(
        styles.container,
        'transition duration-500 border rounded-2xl p-4 w-full'
      )}
    >
      <ContextPreview store={store} />
      <div className="w-full relative">
        <textarea
          ref={textareaRef}
          rows={2}
          className="w-full resize-none bg-transparent focus:outline-none"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {input.length > 0 ? null : (
          <div
            style={{ color: cssVarV2('text/placeholder') }}
            className="absolute left-[2px] top-[2px] text-sm pointer-events-none flex items-center"
          >
            {placeholder}
          </div>
        )}
      </div>
      <footer className="flex items-center justify-between mt-2">
        <ContextSelectorMenu store={store}>
          <IconButton
            icon={<PlusIcon />}
            size="24"
            style={{ borderRadius: 8 }}
          />
        </ContextSelectorMenu>

        <div className="flex items-center gap-2">
          {/* <ModelSelectorMenu model={model} setModel={setModel}>
            <Button className={styles.modelSelector} variant="plain">
              <div className="flex items-center gap-1">
                {model}
                <ArrowDownSmallIcon className="text-xl" />
              </div>
            </Button>
          </ModelSelectorMenu> */}
          <IconButton
            disabled={!input.trim()}
            className={styles.send}
            icon={<ArrowUpBigIcon className="text-white" />}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onSend();
            }}
            loading={isCreating}
          />
        </div>
      </footer>
    </div>
  );
};
