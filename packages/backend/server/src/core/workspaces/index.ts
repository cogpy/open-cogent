import { Module } from '@nestjs/common';

import { FeatureModule } from '../features';
import { MailModule } from '../mail';
import { PermissionModule } from '../permission';
import { QuotaModule } from '../quota';
import { StorageModule } from '../storage';
import { UserModule } from '../user';
import { WorkspacesController } from './controller';
import { WorkspaceEvents } from './event';
import {
  DocResolver,
  WorkspaceBlobResolver,
  WorkspaceDocResolver,
  WorkspaceMemberResolver,
  WorkspaceResolver,
} from './resolvers';
import { WorkspaceService } from './service';

@Module({
  imports: [
    FeatureModule,
    QuotaModule,
    StorageModule,
    UserModule,
    PermissionModule,
    MailModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspaceResolver,
    WorkspaceMemberResolver,
    WorkspaceDocResolver,
    DocResolver,
    WorkspaceBlobResolver,
    WorkspaceService,
    WorkspaceEvents,
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

export { WorkspaceService } from './service';
export { InvitationType, WorkspaceType } from './types';
