import { createHash } from 'node:crypto';

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { FileUpload, JobQueue, PaginationInput } from '../../../base';
import { ServerFeature, ServerService } from '../../../core';
import { Models } from '../../../models';
import { CopilotStorage } from '../storage';
import { readStream } from '../utils';

@Injectable()
export class CopilotUserService implements OnApplicationBootstrap {
  constructor(
    private readonly server: ServerService,
    private readonly models: Models,
    private readonly queue: JobQueue,
    private readonly storage: CopilotStorage
  ) {}

  async onApplicationBootstrap() {
    this.server.enableFeature(ServerFeature.CopilotEmbedding);
  }

  async addFile(userId: string, content: FileUpload) {
    const fileName = content.filename;
    const buffer = await readStream(content.createReadStream());
    const blobId = createHash('sha256').update(buffer).digest('base64url');
    await this.storage.put(userId, blobId, buffer);
    const file = await this.models.copilotUser.addFile(userId, {
      fileName,
      blobId,
      mimeType: content.mimetype,
      size: buffer.length,
    });
    return { blobId, file };
  }

  async getFile(userId: string, fileId: string) {
    return await this.models.copilotUser.getFile(userId, fileId);
  }

  async listFiles(
    workspaceId: string,
    pagination?: {
      includeRead?: boolean;
    } & PaginationInput
  ) {
    return await Promise.all([
      this.models.copilotUser.listFiles(workspaceId, pagination),
      this.models.copilotUser.countFiles(workspaceId),
    ]);
  }

  async queueFileEmbedding(file: Jobs['copilot.embedding.files']) {
    const { userId, blobId, fileId, fileName } = file;
    await this.queue.add('copilot.embedding.files', {
      userId,
      blobId,
      fileId,
      fileName,
    });
  }

  async removeFile(userId: string, fileId: string) {
    return await this.models.copilotUser.removeFile(userId, fileId);
  }
}
