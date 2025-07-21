import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { FileUpload, JobQueue, PaginationInput } from '../../../base';
import { Models } from '../../../models';
import { CopilotStorage } from '../storage';
import { readStream } from '../utils';

@Injectable()
export class CopilotUserService {
  constructor(
    private readonly models: Models,
    private readonly queue: JobQueue,
    private readonly storage: CopilotStorage
  ) {}

  async addDoc(
    userId: string,
    sessionId: string,
    title: string,
    content: string
  ) {
    return await this.models.copilotUser.addDoc(
      userId,
      sessionId,
      title,
      content
    );
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

  async updateDoc(
    userId: string,
    docId: string,
    update: { title?: string; content?: string }
  ) {
    return await this.models.copilotUser.updateDoc(userId, docId, update);
  }

  async getDoc(userId: string, docId: string) {
    return await this.models.copilotUser.getDoc(userId, docId);
  }

  async getFile(userId: string, fileId: string) {
    return await this.models.copilotUser.getFile(userId, fileId);
  }

  async listDocs(
    userId: string,
    pagination?: {
      includeRead?: boolean;
    } & PaginationInput
  ) {
    return await Promise.all([
      this.models.copilotUser.listDocs(userId, pagination),
      this.models.copilotUser.countDocs(userId),
    ]);
  }

  async listFiles(
    userId: string,
    pagination?: {
      includeRead?: boolean;
    } & PaginationInput
  ) {
    return await Promise.all([
      this.models.copilotUser.listFiles(userId, pagination),
      this.models.copilotUser.countFiles(userId),
    ]);
  }

  async queueDocEmbedding(doc: Jobs['copilot.embedding.doc']) {
    const { userId, docId } = doc;
    await this.queue.add('copilot.embedding.doc', { userId, docId });
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

  async removeDoc(userId: string, docId: string) {
    return await this.models.copilotUser.removeDoc(userId, docId);
  }

  async removeFile(userId: string, fileId: string) {
    return await this.models.copilotUser.removeFile(userId, fileId);
  }
}
