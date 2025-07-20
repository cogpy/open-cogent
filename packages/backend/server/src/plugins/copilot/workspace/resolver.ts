import {
  Args,
  Context,
  Field,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import GraphQLUpload, {
  type FileUpload,
} from 'graphql-upload/GraphQLUpload.mjs';

import {
  BlobQuotaExceeded,
  CopilotFailedToAddWorkspaceFileEmbedding,
  Mutex,
  paginate,
  PaginationInput,
  TooManyRequest,
  UserFriendlyError,
} from '../../../base';
import { CurrentUser } from '../../../core/auth';
import { UserType } from '../../../core/user';
import { COPILOT_LOCKER } from '../resolver';
import { MAX_EMBEDDABLE_SIZE } from '../types';
import { CopilotUserService } from './service';
import { CopilotUserFileType, PaginatedCopilotUserFileType } from './types';

@ObjectType('CopilotWorkspaceConfig')
export class CopilotUserConfigType {
  @Field(() => String)
  userId!: string;
}

/**
 * Workspace embedding config resolver
 * Public apis rate limit: 10 req/m
 * Other rate limit: 120 req/m
 */
@Resolver(() => UserType)
export class CopilotUserEmbeddingResolver {
  @ResolveField(() => CopilotUserConfigType, {
    complexity: 2,
  })
  async embedding(
    @CurrentUser() user: CurrentUser
  ): Promise<CopilotUserConfigType> {
    return { userId: user.id };
  }
}

@Resolver(() => CopilotUserConfigType)
export class CopilotUserEmbeddingConfigResolver {
  constructor(
    private readonly mutex: Mutex,
    private readonly copilotUser: CopilotUserService
  ) {}

  @ResolveField(() => PaginatedCopilotUserFileType, {
    complexity: 2,
  })
  async files(
    @Parent() config: CopilotUserConfigType,
    @Args('pagination', PaginationInput.decode) pagination: PaginationInput
  ): Promise<PaginatedCopilotUserFileType> {
    const [files, totalCount] = await this.copilotUser.listFiles(
      config.userId,
      pagination
    );

    return paginate(files, 'createdAt', pagination, totalCount);
  }

  @Mutation(() => CopilotUserFileType, {
    name: 'addWorkspaceEmbeddingFiles',
    complexity: 2,
    description: 'Update workspace embedding files',
  })
  async addFiles(
    @Context() ctx: { req: Request },
    @CurrentUser() user: CurrentUser,

    @Args({ name: 'blob', type: () => GraphQLUpload })
    content: FileUpload
  ): Promise<CopilotUserFileType> {
    const lockFlag = `${COPILOT_LOCKER}:user:${user.id}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      throw new TooManyRequest('Server is busy');
    }

    const length = Number(ctx.req.headers['content-length']);
    if (length && length >= MAX_EMBEDDABLE_SIZE) {
      throw new BlobQuotaExceeded();
    }

    try {
      const { blobId, file } = await this.copilotUser.addFile(user.id, content);
      await this.copilotUser.queueFileEmbedding({
        userId: user.id,
        blobId,
        fileId: file.fileId,
        fileName: file.fileName,
      });

      return file;
    } catch (e: any) {
      // passthrough user friendly error
      if (e instanceof UserFriendlyError) {
        throw e;
      }
      throw new CopilotFailedToAddWorkspaceFileEmbedding({
        message: e.message,
      });
    }
  }

  @Mutation(() => Boolean, {
    name: 'removeUserEmbeddingFiles',
    complexity: 2,
    description: 'Remove user embedding files',
  })
  async removeFiles(
    @CurrentUser() user: CurrentUser,
    @Args('fileId', { type: () => String })
    fileId: string
  ): Promise<boolean> {
    return await this.copilotUser.removeFile(user.id, fileId);
  }
}
