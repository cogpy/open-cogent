import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ChatInterface } from '@/components/chat/chat-interface';
import { OpenDocProvider } from '@/contexts/doc-panel-context';
import { useRefCounted } from '@/lib/hooks/use-ref-counted';
import { copilotClient } from '@/store/copilot/client';
import { chatSessionsStore } from '@/store/copilot/sessions-instance';
import { useSidebarStore } from '@/store/sidebar';

const PlaybackHeader = ({ title }: { title: string }) => {
  return (
    <div className="h-15 border-b-[0.5px] px-4 flex items-center justify-between gap-4">
      <Link to="/">
        <img src="/logo.svg" alt="OpenAgent" className="size-6" />
      </Link>
      <div className="text-sm font-medium text-text-primary truncate flex-1">
        {title}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <button className="bg-black text-white px-4 py-1 h-8 rounded-md text-sm font-medium cursor-pointer">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Playback page renders chat messages one-by-one in read-only mode.
 */
export const ChatPlaybackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { setOpen } = useSidebarStore();

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  // Track playback status for bottom pane
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [version, setVersion] = useState(0); // to force remount for replay
  const [skipped, setSkipped] = useState(false);

  // Acquire shared store (read-only power)
  const sessionStore = useRefCounted(
    id,
    () =>
      id
        ? chatSessionsStore.getState().acquire({
            sessionId: id,
            client: copilotClient,
          })
        : null,
    () => {
      id && chatSessionsStore.getState().release(id);
    }
  );

  // If no id -> redirect back
  useEffect(() => {
    if (!id) navigate('/chats');
  }, [id, navigate]);

  const handleStart = useCallback(() => {
    setFinished(false);
    setProgress(null);
  }, []);

  const handleProgress = useCallback((current: number, total: number) => {
    setProgress({ current, total });
  }, []);

  const handleFinish = useCallback(() => {
    setFinished(true);
  }, []);

  const replay = useCallback(() => {
    setSkipped(false);
    setVersion(v => v + 1);
  }, []);

  const skipToEnd = useCallback(() => {
    setSkipped(true);
  }, []);

  /* -------------------------------- Banner ---------------------------- */
  const Banner = ({
    children,
    position,
  }: {
    children: ReactNode;
    position: 'top' | 'bottom';
  }) => {
    const base =
      'absolute left-1/2 -translate-x-1/2 w-[500px] bg-white shadow-lg border rounded-xl flex items-center justify-between gap-4 pl-4 pr-2 h-14';
    const posClass = position === 'top' ? 'top-20 rounded-full' : 'bottom-6';
    return <div className={`${base} ${posClass}`}>{children}</div>;
  };

  return (
    <OpenDocProvider value={{ openDoc: () => {}, closeDoc: () => {} }}>
      <div className="flex-1 bg-white border rounded-[8px] overflow-hidden relative h-full">
        {id && sessionStore ? (
          <ChatInterface
            key={version}
            store={sessionStore}
            playback
            className="flex-1"
            headerContent={
              <PlaybackHeader
                title={sessionStore.getState().meta?.title ?? 'New Chat'}
              />
            }
            onPlaybackStart={handleStart}
            onPlaybackProgress={handleProgress}
            onPlaybackFinish={handleFinish}
            skipPlayback={skipped}
          />
        ) : null}

        {!finished && !skipped && (
          <Banner position="bottom">
            <span className="font-medium flex items-center gap-2">
              <img src="/logo.svg" alt="OpenAgent" className="size-6" />
              OpenAgent is replaying task...
            </span>
            <button
              className="bg-black text-white px-4 py-1 rounded-md text-sm h-10 font-medium cursor-pointer"
              onClick={skipToEnd}
            >
              Skip to results
            </button>
          </Banner>
        )}

        {finished && (
          <Banner position="bottom">
            <span className="font-medium flex items-center gap-2">
              <img src="/logo.svg" alt="OpenAgent" className="size-6" />
              OpenAgent replay completed
            </span>
            <button
              className="bg-black text-white px-4 py-1 rounded-md text-sm h-10 font-medium cursor-pointer"
              onClick={replay}
            >
              Watch again
            </button>
          </Banner>
        )}
      </div>
    </OpenDocProvider>
  );
};
