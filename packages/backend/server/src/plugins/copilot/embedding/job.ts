import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  BlobNotFound,
  CallMetric,
  EventBus,
  JobQueue,
  mapAnyError,
  OnEvent,
  OnJob,
} from '../../../base';
import { Models } from '../../../models';
import { CopilotStorage } from '../storage';
import { readStream } from '../utils';
import { getEmbeddingClient } from './client';
import { EmbeddingClient } from './types';

@Injectable()
export class CopilotEmbeddingJob {
  private client: EmbeddingClient | undefined;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly event: EventBus,
    private readonly models: Models,
    private readonly queue: JobQueue,
    private readonly storage: CopilotStorage
  ) {}

  @OnEvent('config.init')
  async onConfigInit() {
    await this.setup();
  }

  @OnEvent('config.changed')
  async onConfigChanged() {
    await this.setup();
  }

  private async setup() {
    this.client = await getEmbeddingClient(this.moduleRef);
  }

  // public this client to allow overriding in tests
  get embeddingClient() {
    return this.client as EmbeddingClient;
  }

  @CallMetric('ai', 'addFileEmbeddingQueue')
  async addFileEmbeddingQueue(file: Jobs['copilot.embedding.files']) {
    const { userId, contextId, blobId, fileId, fileName } = file;
    await this.queue.add('copilot.embedding.files', {
      userId,
      contextId,
      blobId,
      fileId,
      fileName,
    });
  }

  private async readCopilotBlob(
    userId: string,
    blobId: string,
    fileName: string
  ) {
    const { body } = await this.storage.get(userId, blobId);
    if (!body) throw new BlobNotFound({ userId, blobId });
    const buffer = await readStream(body);
    return new File([buffer], fileName);
  }

  @OnJob('copilot.embedding.files')
  async embedPendingFile({
    userId,
    contextId,
    blobId,
    fileId,
    fileName,
  }: Jobs['copilot.embedding.files']) {
    if (!this.embeddingClient) return;

    try {
      const file = await this.readCopilotBlob(userId, blobId, fileName);

      // no need to check if embeddings is empty, will throw internally
      const chunks = await this.embeddingClient.getFileChunks(file);
      const total = chunks.reduce((acc, c) => acc + c.length, 0);

      for (const chunk of chunks) {
        const embeddings = await this.embeddingClient.generateEmbeddings(chunk);
        if (contextId) {
          // for context files
          await this.models.copilotContext.insertFileEmbedding(
            contextId,
            fileId,
            embeddings
          );
        } else {
          // for user files
          await this.models.copilotUser.insertFileEmbeddings(
            userId,
            fileId,
            embeddings
          );
        }
      }

      if (contextId) {
        this.event.emit('workspace.file.embed.finished', {
          contextId,
          fileId,
          chunkSize: total,
        });
      }
    } catch (error: any) {
      if (contextId) {
        this.event.emit('workspace.file.embed.failed', {
          contextId,
          fileId,
          error: mapAnyError(error).message,
        });
      }

      // passthrough error to job queue
      throw error;
    }
  }
}
