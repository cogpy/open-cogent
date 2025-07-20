import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';

import { PaginationInput } from '../base';
import { BaseModel } from './base';
import type {
  CopilotUserFile,
  CopilotUserFileMetadata,
  Embedding,
  FileChunkSimilarity,
} from './common';

@Injectable()
export class CopilotUserConfigModel extends BaseModel {
  @Transactional()
  async getUserEmbeddingStatus(userId: string) {
    const [fileTotal, fileEmbedded] = await Promise.all([
      this.db.aiUserFiles.count({ where: { userId } }),
      this.db.aiUserFiles.count({
        where: { userId, embeddings: { some: {} } },
      }),
    ]);

    return {
      total: fileTotal,
      embedded: fileEmbedded,
    };
  }

  // ================ embeddings ================

  private processEmbeddings(
    userId: string,
    fileId: string,
    embeddings: Embedding[]
  ) {
    const groups = embeddings.map(e =>
      [
        userId,
        fileId,
        e.index,
        e.content,
        Prisma.raw(`'[${e.embedding.join(',')}]'`),
      ].filter(v => v !== undefined)
    );
    return Prisma.join(groups.map(row => Prisma.sql`(${Prisma.join(row)})`));
  }

  async addFile(
    userId: string,
    file: CopilotUserFileMetadata
  ): Promise<CopilotUserFile> {
    const fileId = randomUUID();
    const row = await this.db.aiUserFiles.create({
      data: { ...file, userId, fileId },
    });

    return row;
  }

  async getFile(userId: string, fileId: string) {
    const file = await this.db.aiUserFiles.findFirst({
      where: { userId, fileId },
    });
    return file;
  }

  @Transactional()
  async insertFileEmbeddings(
    userId: string,
    fileId: string,
    embeddings: Embedding[]
  ) {
    if (embeddings.length === 0) {
      this.logger.warn(
        `No embeddings provided for userId: ${userId}, fileId: ${fileId}. Skipping insertion.`
      );
      return;
    }

    const values = this.processEmbeddings(userId, fileId, embeddings);
    await this.db.$executeRaw`
          INSERT INTO "ai_user_file_embeddings"
          ("user_id", "file_id", "chunk", "content", "embedding") VALUES ${values}
          ON CONFLICT (user_id, file_id, chunk) DO NOTHING;
      `;
  }

  async listFiles(
    userId: string,
    options?: {
      includeRead?: boolean;
    } & PaginationInput
  ): Promise<CopilotUserFile[]> {
    const files = await this.db.aiUserFiles.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: options?.offset,
      take: options?.first,
    });
    return files;
  }

  async countFiles(userId: string): Promise<number> {
    const count = await this.db.aiUserFiles.count({
      where: { userId },
    });
    return count;
  }

  async matchFileEmbedding(
    embedding: number[],
    userId: string,
    topK: number,
    threshold: number
  ): Promise<FileChunkSimilarity[]> {
    const similarityChunks = await this.db.$queryRaw<
      Array<FileChunkSimilarity>
    >`
      SELECT
        e."file_id" as "fileId",
        f."file_name" as "name",
        f."blob_id" as "blobId",
        f."mime_type" as "mimeType",
        e."chunk",
        e."content",
        e."embedding" <=> ${embedding}::vector as "distance" 
      FROM "ai_user_file_embeddings" e
      JOIN "ai_user_files" f
        ON e."user_id" = f."user_id"
        AND e."file_id" = f."file_id"
      WHERE e."user_id" = ${userId}
      ORDER BY "distance" ASC
      LIMIT ${topK};
    `;
    return similarityChunks.filter(c => Number(c.distance) <= threshold);
  }

  async removeFile(userId: string, fileId: string) {
    // embeddings will be removed by foreign key constraint
    await this.db.aiUserFiles.deleteMany({
      where: {
        userId,
        fileId,
      },
    });
    return true;
  }
}
