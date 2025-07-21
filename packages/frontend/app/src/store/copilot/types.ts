import type { CopilotClient } from './client';

export interface ChatMessage {
  id: string | null;
  content: string;
  role: 'user' | 'assistant' | 'system' | string;
  createdAt?: string;
  // Other server-returned fields are allowed
  [key: string]: unknown;
}

export interface SessionMeta {
  title?: string | null;
  createdAt?: string | null;
  pinned?: boolean | null;
  modelId?: string | null;

  // Additional meta information coming from backend
  [key: string]: unknown;
}

export interface SessionFlags {
  isInitializing: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isStreaming: boolean;
}

export interface ChatSessionState extends SessionFlags {
  // Identifiers
  sessionId: string;

  error?: Error;

  // Data
  meta: SessionMeta | null;
  messages: ChatMessage[];

  /* ---------------- Actions -------------- */
  init(): Promise<void>;
  reload(): Promise<void>;
  sendMessage(options: Omit<SendMessageOptions, 'sessionId'>): Promise<void>;
  updateMeta(options: UpdateSessionOptions): Promise<void>;
  cleanup(sessionIds: string[]): Promise<void>;
  clearError(): void;
  /** Load older messages (prepend). Returns when fetch completes. */
  loadMore(limit?: number): Promise<void>;

  /** Toggle pinned state for this session. */
  togglePin(): Promise<void>;
}

export type SendMessageOptions = Parameters<CopilotClient['createMessage']>[0];
export type UpdateSessionOptions = Parameters<
  CopilotClient['updateSession']
>[0];
