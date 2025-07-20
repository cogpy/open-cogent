import { AiJobStatus, AiJobType } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { z } from 'zod';

export interface CopilotJob {
  id?: string;
  workspaceId: string;
  blobId: string;
  createdBy?: string;
  type: AiJobType;
  status?: AiJobStatus;
  payload?: JsonValue;
}

export interface CopilotContext {
  id?: string;
  sessionId: string;
  config: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContextEmbedStatus {
  processing = 'processing',
  finished = 'finished',
  failed = 'failed',
}

const ContextEmbedStatusSchema = z.enum([
  ContextEmbedStatus.processing,
  ContextEmbedStatus.finished,
  ContextEmbedStatus.failed,
]);

export const ContextFileSchema = z.object({
  id: z.string(),
  chunkSize: z.number(),
  name: z.string(),
  mimeType: z.string().optional(),
  status: ContextEmbedStatusSchema,
  error: z.string().nullable(),
  blobId: z.string(),
  createdAt: z.number(),
});

export const ContextConfigSchema = z.object({
  userId: z.string(),
  files: ContextFileSchema.array(),
});

export const MinimalContextConfigSchema = ContextConfigSchema.pick({
  userId: true,
});

export type ContextConfig = z.infer<typeof ContextConfigSchema>;
export type ContextFile = z.infer<typeof ContextConfigSchema>['files'][number];
export type ContextList = ContextFile[];

// embeddings

export type Embedding = {
  /**
   * The index of the embedding in the list of embeddings.
   */
  index: number;
  content: string;
  embedding: Array<number>;
};

export type ChunkSimilarity = {
  chunk: number;
  content: string;
  distance: number | null;
};

export type FileChunkSimilarity = ChunkSimilarity & {
  fileId: string;
  blobId: string;
  name: string;
  mimeType: string;
};

export const CopilotWorkspaceFileSchema = z.object({
  fileName: z.string(),
  blobId: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

export type CopilotUserFileMetadata = z.infer<
  typeof CopilotWorkspaceFileSchema
>;
export type CopilotUserFile = CopilotUserFileMetadata & {
  userId: string;
  fileId: string;
  createdAt: Date;
};
