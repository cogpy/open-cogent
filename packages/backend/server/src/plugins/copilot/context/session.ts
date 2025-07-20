import { nanoid } from 'nanoid';

import {
  ContextConfig,
  ContextEmbedStatus,
  ContextFile,
  ContextList,
  FileChunkSimilarity,
  Models,
} from '../../../models';
import { EmbeddingClient } from '../embedding';

export class ContextSession implements AsyncDisposable {
  constructor(
    private readonly client: EmbeddingClient | undefined,
    private readonly contextId: string,
    private readonly config: ContextConfig,
    private readonly models: Models,
    private readonly dispatcher?: (config: ContextConfig) => Promise<void>
  ) {}

  get id() {
    return this.contextId;
  }

  get userId() {
    return this.config.userId;
  }

  get files() {
    return this.config.files.map(f => this.fulfillFile(f));
  }

  get sortedList(): ContextList {
    const { files } = this.config;
    return [...files].toSorted(
      (a, b) => a.createdAt - b.createdAt
    ) as ContextList;
  }

  private fulfillFile(file: ContextFile): Required<ContextFile> {
    return {
      ...file,
      mimeType: file.mimeType || 'application/octet-stream',
    };
  }

  async addFile(
    blobId: string,
    name: string,
    mimeType: string
  ): Promise<Required<ContextFile>> {
    let fileId = nanoid();
    const existsBlob = this.config.files.find(f => f.blobId === blobId);
    if (existsBlob) {
      // use exists file id if the blob exists
      // we assume that the file content pointed to by the same blobId is consistent.
      if (existsBlob.status === ContextEmbedStatus.finished) {
        return this.fulfillFile(existsBlob);
      }
      fileId = existsBlob.id;
    } else {
      await this.saveFileRecord(fileId, file => ({
        ...file,
        blobId,
        chunkSize: 0,
        name,
        mimeType,
        error: null,
        createdAt: Date.now(),
      }));
    }
    return this.fulfillFile(this.getFile(fileId) as ContextFile);
  }

  getFile(fileId: string): ContextFile | undefined {
    return this.config.files.find(f => f.id === fileId);
  }

  async removeFile(fileId: string): Promise<boolean> {
    await this.models.copilotContext.deleteFileEmbedding(
      this.contextId,
      fileId
    );
    this.config.files = this.config.files.filter(f => f.id !== fileId);
    await this.save();
    return true;
  }

  /**
   * Match the input text with the file chunks
   * @param content input text to match
   * @param topK number of similar chunks to return, default 5
   * @param signal abort signal
   * @param threshold relevance threshold for the similarity score, higher threshold means more similar chunks, default 0.7, good enough based on prior experiments
   * @returns list of similar chunks
   */
  async matchFiles(
    content: string,
    topK: number = 5,
    signal?: AbortSignal,
    scopedThreshold: number = 0.85,
    threshold: number = 0.5
  ): Promise<FileChunkSimilarity[]> {
    if (!this.client) return [];
    const embedding = await this.client.getEmbedding(content, signal);
    if (!embedding) return [];

    const [context, workspace] = await Promise.all([
      this.models.copilotContext.matchFileEmbedding(
        embedding,
        this.id,
        topK * 2,
        scopedThreshold
      ),
      this.models.copilotUser.matchFileEmbedding(
        embedding,
        topK * 2,
        threshold
      ),
    ]);
    const files = new Map(this.files.map(f => [f.id, f]));

    return this.client.reRank(
      content,
      [
        ...context
          .filter(f => files.has(f.fileId))
          .map(c => {
            const { blobId, name, mimeType } = files.get(
              c.fileId
            ) as Required<ContextFile>;
            return { ...c, blobId, name, mimeType };
          }),
        ...workspace,
      ],
      topK,
      signal
    );
  }

  async saveFileRecord(
    fileId: string,
    cb: (
      record: Pick<ContextFile, 'id' | 'status'> &
        Partial<Omit<ContextFile, 'id' | 'status'>>
    ) => ContextFile
  ) {
    const files = this.config.files;
    const file = files.find(f => f.id === fileId);
    if (file) {
      Object.assign(file, cb({ ...file }));
    } else {
      const file = { id: fileId, status: ContextEmbedStatus.processing };
      files.push(cb(file));
    }
    await this.save();
  }

  async save() {
    await this.dispatcher?.(this.config);
  }

  async [Symbol.asyncDispose]() {
    await this.save();
  }
}
