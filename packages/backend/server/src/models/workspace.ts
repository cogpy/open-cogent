import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, type Workspace } from '@prisma/client';

import { BaseModel } from './base';

export type { Workspace };
export type UpdateWorkspaceInput = Pick<
  Partial<Workspace>,
  | 'public'
  | 'enableAi'
  | 'enableUrlPreview'
  | 'enableDocEmbedding'
  | 'name'
  | 'avatarKey'
  | 'indexed'
>;

@Injectable()
export class WorkspaceModel extends BaseModel {
  // #region workspace
  /**
   * Create a new workspace for the user, default to private.
   */
  @Transactional()
  async create(userId: string) {
    const workspace = await this.db.workspace.create({
      data: { public: false },
    });
    this.logger.log(`Workspace created with id ${workspace.id}`);
    await this.models.workspaceUser.setOwner(workspace.id, userId);
    return workspace;
  }

  /**
   * Update the workspace with the given data.
   */
  async update(workspaceId: string, data: UpdateWorkspaceInput) {
    const workspace = await this.db.workspace.update({
      where: {
        id: workspaceId,
      },
      data,
    });
    this.logger.debug(
      `Updated workspace ${workspaceId} with data ${JSON.stringify(data)}`
    );

    return workspace;
  }

  async get(workspaceId: string) {
    return await this.db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });
  }

  async findMany(ids: string[]) {
    return await this.db.workspace.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async listAfterSid(sid: number, limit: number) {
    return await this.db.workspace.findMany({
      where: {
        sid: { gt: sid },
      },
      take: limit,
      orderBy: {
        sid: 'asc',
      },
    });
  }

  async list<S extends Prisma.WorkspaceSelect>(
    where: Prisma.WorkspaceWhereInput = {},
    select?: S
  ) {
    return (await this.db.workspace.findMany({
      where,
      select,
      orderBy: {
        sid: 'asc',
      },
    })) as Prisma.WorkspaceGetPayload<{ select: S }>[];
  }

  async delete(workspaceId: string) {
    await this.db.workspace.deleteMany({
      where: {
        id: workspaceId,
      },
    });
  }

  async allowUrlPreview(workspaceId: string) {
    const workspace = await this.get(workspaceId);
    return workspace?.enableUrlPreview ?? false;
  }

  async allowEmbedding(workspaceId: string) {
    const workspace = await this.get(workspaceId);
    return workspace?.enableDocEmbedding ?? false;
  }

  async isTeamWorkspace(workspaceId: string) {
    return this.models.workspaceFeature.has(workspaceId, 'team_plan_v1');
  }
  // #endregion
}
