import { Field, ObjectType } from '@nestjs/graphql';
import { SafeIntResolver } from 'graphql-scalars';

import { Paginated } from '../../../base';
import { CopilotUserFile } from '../../../models';

declare global {
  interface Events {
    'workspace.file.embedding.finished': {
      jobId: string;
    };
    'workspace.file.embedding.failed': {
      jobId: string;
    };
  }
}

@ObjectType('CopilotUserFile')
export class CopilotUserFileType implements CopilotUserFile {
  @Field(() => String)
  userId!: string;

  @Field(() => String)
  fileId!: string;

  @Field(() => String)
  blobId!: string;

  @Field(() => String)
  fileName!: string;

  @Field(() => String)
  mimeType!: string;

  @Field(() => SafeIntResolver)
  size!: number;

  @Field(() => Date)
  createdAt!: Date;
}

@ObjectType('PaginatedCopilotUserFile')
export class PaginatedCopilotUserFileType extends Paginated(
  CopilotUserFileType
) {}
