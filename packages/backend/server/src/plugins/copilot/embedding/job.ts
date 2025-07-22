import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  BlobNotFound,
  CopilotSessionNotFound,
  EventBus,
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

  private async readCopilotChats(userId: string, sessionId: string) {
    const session = await this.models.copilotSession.getExists(sessionId, {
      userId: true,
      title: true,
    });
    if (!session || session.userId !== userId) {
      throw new CopilotSessionNotFound();
    }
    const messages = await this.models.copilotSession.getMessages(sessionId, {
      role: true,
      content: true,
    });
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    return new File(
      [content],
      (session.title && `${session.title}.md`) || 'Untitled.txt'
    );
  }

  @OnJob('copilot.embedding.chats')
  async embedPendingChats({
    contextId,
    userId,
    sessionId,
  }: Jobs['copilot.embedding.chats']) {
    if (!this.embeddingClient) return;

    try {
      const chatMessages = await this.readCopilotChats(userId, sessionId);

      // no need to check if embeddings is empty, will throw internally
      const chunks = await this.embeddingClient.getFileChunks(chatMessages);
      const total = chunks.reduce((acc, c) => acc + c.length, 0);

      for (const chunk of chunks) {
        const embeddings = await this.embeddingClient.generateEmbeddings(chunk);
        await this.models.copilotUser.insertChatEmbeddings(
          userId,
          sessionId,
          embeddings
        );
      }

      this.event.emit('user.chat.embed.finished', {
        contextId,
        sessionId,
        chunkSize: total,
      });
    } catch (error: any) {
      this.event.emit('user.chat.embed.failed', {
        contextId,
        sessionId,
        error: mapAnyError(error).message,
      });

      // passthrough error to job queue
      throw error;
    }
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
        this.event.emit('user.file.embed.finished', {
          contextId,
          fileId,
          chunkSize: total,
        });
      }
    } catch (error: any) {
      if (contextId) {
        this.event.emit('user.file.embed.failed', {
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
