import { createHash } from 'node:crypto';

import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Parent,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import { SafeIntResolver } from 'graphql-scalars';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import {
  BlobQuotaExceeded,
  CallMetric,
  CopilotFailedToMatchContext,
  CopilotFailedToMatchGlobalContext,
  CopilotFailedToModifyContext,
  CopilotSessionNotFound,
  type FileUpload,
  RequestMutex,
  Throttle,
  TooManyRequest,
  UserFriendlyError,
} from '../../../base';
import { CurrentUser } from '../../../core/auth';
import {
  ArtifactEmbedStatus,
  ContextChat,
  ContextFile,
  FileChunkSimilarity,
  Models,
} from '../../../models';
import { CopilotEmbeddingJob } from '../embedding';
import { COPILOT_LOCKER, CopilotType } from '../resolver';
import { ChatSessionService } from '../session';
import { CopilotStorage } from '../storage';
import { MAX_EMBEDDABLE_SIZE } from '../types';
import { getSignal, readStream } from '../utils';
import { CopilotContextService } from './service';

@InputType()
class AddContextFileInput {
  @Field(() => String)
  contextId!: string;
}

@InputType()
class RemoveContextFileInput {
  @Field(() => String)
  contextId!: string;

  @Field(() => String)
  fileId!: string;
}

@ObjectType('CopilotContext')
export class CopilotContextType {
  @Field(() => ID)
  userId!: string;

  @Field(() => ID, { nullable: true })
  id!: string | undefined;
}

registerEnumType(ArtifactEmbedStatus, { name: 'ContextEmbedStatus' });

@ObjectType()
class CopilotContextChat implements ContextChat {
  @Field(() => ID)
  id!: string;

  @Field(() => SafeIntResolver)
  chunkSize!: number;

  @Field(() => ArtifactEmbedStatus)
  status!: ArtifactEmbedStatus;

  @Field(() => String, { nullable: true })
  error!: string | null;

  @Field(() => SafeIntResolver)
  createdAt!: number;
}

@ObjectType()
class CopilotContextFile implements ContextFile {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  mimeType!: string;

  @Field(() => SafeIntResolver)
  chunkSize!: number;

  @Field(() => ArtifactEmbedStatus)
  status!: ArtifactEmbedStatus;

  @Field(() => String, { nullable: true })
  error!: string | null;

  @Field(() => String)
  blobId!: string;

  @Field(() => SafeIntResolver)
  createdAt!: number;
}

@ObjectType()
class ContextMatchedFileChunk implements FileChunkSimilarity {
  @Field(() => String)
  fileId!: string;

  @Field(() => String)
  blobId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  mimeType!: string;

  @Field(() => SafeIntResolver)
  chunk!: number;

  @Field(() => String)
  content!: string;

  @Field(() => Float, { nullable: true })
  distance!: number | null;
}

@ObjectType()
class ContextUserEmbeddingStatus {
  @Field(() => SafeIntResolver)
  total!: number;

  @Field(() => SafeIntResolver)
  embedded!: number;
}

@Throttle()
@Resolver(() => CopilotType)
export class CopilotContextRootResolver {
  constructor(
    private readonly mutex: RequestMutex,
    private readonly chatSession: ChatSessionService,
    private readonly context: CopilotContextService,
    private readonly models: Models
  ) {}

  private async checkChatSession(
    user: CurrentUser,
    sessionId: string
  ): Promise<void> {
    const session = await this.chatSession.get(sessionId);
    if (!session || session.config.userId !== user.id) {
      throw new CopilotSessionNotFound();
    }
  }

  @ResolveField(() => [CopilotContextType], {
    description: 'Get the context list of a session',
    complexity: 2,
  })
  @CallMetric('ai', 'context_create')
  async contexts(
    @Parent() _copilot: CopilotType,
    @CurrentUser() user: CurrentUser,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @Args('contextId', { nullable: true }) contextId?: string
  ): Promise<CopilotContextType[]> {
    if (sessionId || contextId) {
      const lockFlag = `${COPILOT_LOCKER}:context:${sessionId || contextId}`;
      await using lock = await this.mutex.acquire(lockFlag);
      if (!lock) {
        throw new TooManyRequest('Server is busy');
      }

      if (contextId) {
        const context = await this.context.get(contextId);
        if (context) return [context];
      } else if (sessionId) {
        await this.checkChatSession(user, sessionId);
        const context = await this.context.getBySessionId(sessionId);
        if (context) return [context];
      }
    }

    return [{ userId: user.id, id: undefined }];
  }

  @Mutation(() => String, {
    description: 'Create a context session',
  })
  @CallMetric('ai', 'context_create')
  async createCopilotContext(
    @CurrentUser() user: CurrentUser,
    @Args('sessionId') sessionId: string
  ): Promise<string> {
    const lockFlag = `${COPILOT_LOCKER}:context:${sessionId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      throw new TooManyRequest('Server is busy');
    }
    await this.checkChatSession(user, sessionId);

    const context = await this.context.create(sessionId);
    return context.id;
  }

  @ResolveField(() => ContextUserEmbeddingStatus, {
    description: 'query user embedding status',
  })
  @CallMetric('ai', 'context_query_user_embedding_status')
  async embeddingStatus(
    @CurrentUser() user: CurrentUser
  ): Promise<ContextUserEmbeddingStatus> {
    const { total, embedded } =
      await this.models.copilotUser.getUserEmbeddingStatus(user.id);
    return { total, embedded };
  }
}

@Throttle()
@Resolver(() => CopilotContextType)
export class CopilotContextResolver {
  constructor(
    private readonly mutex: RequestMutex,
    private readonly context: CopilotContextService,
    private readonly jobs: CopilotEmbeddingJob,
    private readonly storage: CopilotStorage
  ) {}

  @ResolveField(() => [CopilotContextFile], {
    description: 'list files in context',
  })
  @CallMetric('ai', 'context_file_list')
  async files(
    @Parent() context: CopilotContextType
  ): Promise<CopilotContextFile[]> {
    if (!context.id) {
      return [];
    }
    const session = await this.context.get(context.id);
    return session.files;
  }

  @Mutation(() => CopilotContextFile, {
    description: 'add a file to context',
  })
  @CallMetric('ai', 'context_file_add')
  async addContextFile(
    @CurrentUser() user: CurrentUser,
    @Context() ctx: { req: Request },
    @Args({ name: 'options', type: () => AddContextFileInput })
    options: AddContextFileInput,
    @Args({ name: 'content', type: () => GraphQLUpload })
    content: FileUpload
  ): Promise<CopilotContextFile> {
    const { contextId } = options;

    const lockFlag = `${COPILOT_LOCKER}:context:${contextId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      throw new TooManyRequest('Server is busy');
    }

    const length = Number(ctx.req.headers['content-length']);
    if (length && length >= MAX_EMBEDDABLE_SIZE) {
      throw new BlobQuotaExceeded();
    }

    const session = await this.context.get(contextId);

    try {
      const buffer = await readStream(content.createReadStream());
      const blobId = createHash('sha256').update(buffer).digest('base64url');
      const { filename, mimetype } = content;

      await this.storage.put(user.id, blobId, buffer);
      const file = await session.addFile(blobId, filename, mimetype);

      await this.jobs.addFileEmbeddingQueue({
        userId: user.id,
        contextId: session.id,
        blobId: file.blobId,
        fileId: file.id,
        fileName: file.name,
      });

      return file;
    } catch (e: any) {
      // passthrough user friendly error
      if (e instanceof UserFriendlyError) {
        throw e;
      }
      throw new CopilotFailedToModifyContext({ contextId, message: e.message });
    }
  }

  @Mutation(() => Boolean, {
    description: 'remove a file from context',
  })
  @CallMetric('ai', 'context_file_remove')
  async removeContextFile(
    @Args({ name: 'options', type: () => RemoveContextFileInput })
    options: RemoveContextFileInput
  ): Promise<boolean> {
    const lockFlag = `${COPILOT_LOCKER}:context:${options.contextId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      throw new TooManyRequest('Server is busy');
    }
    const session = await this.context.get(options.contextId);

    try {
      return await session.removeFile(options.fileId);
    } catch (e: any) {
      throw new CopilotFailedToModifyContext({
        contextId: options.contextId,
        message: e.message,
      });
    }
  }

  @ResolveField(() => [ContextMatchedFileChunk], {
    description: 'match file in context',
  })
  @CallMetric('ai', 'context_file_remove')
  async matchFiles(
    @Context() ctx: { req: Request },
    @Parent() context: CopilotContextType,
    @Args('content') content: string,
    @Args('limit', { type: () => SafeIntResolver, nullable: true })
    limit?: number,
    @Args('scopedThreshold', { type: () => Float, nullable: true })
    scopedThreshold?: number,
    @Args('threshold', { type: () => Float, nullable: true })
    threshold?: number
  ): Promise<ContextMatchedFileChunk[]> {
    try {
      if (!context.id) {
        return await this.context.matchFiles(
          content,
          context.userId,
          limit,
          getSignal(ctx.req).signal,
          threshold
        );
      }

      const session = await this.context.get(context.id);
      return await session.matchFiles(
        content,
        limit,
        getSignal(ctx.req).signal,
        scopedThreshold,
        threshold
      );
    } catch (e: any) {
      // passthrough user friendly error
      if (e instanceof UserFriendlyError) {
        throw e;
      }

      if (context.id) {
        throw new CopilotFailedToMatchContext({
          contextId: context.id,
          // don't record the large content
          content: content.slice(0, 512),
          message: e.message,
        });
      } else {
        throw new CopilotFailedToMatchGlobalContext({
          userId: context.userId,
          // don't record the large content
          content: content.slice(0, 512),
          message: e.message,
        });
      }
    }
  }
}
