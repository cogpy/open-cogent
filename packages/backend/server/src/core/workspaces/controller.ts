import { Controller, Get, Logger, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { BlobNotFound, CallMetric } from '../../base';
import { CurrentUser, Public } from '../auth';
import { AccessController } from '../permission';
import { WorkspaceBlobStorage } from '../storage';

@Controller('/api/workspaces')
export class WorkspacesController {
  logger = new Logger(WorkspacesController.name);
  constructor(
    private readonly storage: WorkspaceBlobStorage,
    private readonly ac: AccessController
  ) {}

  // get workspace blob
  //
  // NOTE: because graphql can't represent a File, so we have to use REST API to get blob
  @Public()
  @Get('/:id/blobs/:name')
  @CallMetric('controllers', 'workspace_get_blob')
  async blob(
    @CurrentUser() user: CurrentUser | undefined,
    @Param('id') workspaceId: string,
    @Param('name') name: string,
    @Query('redirect') redirect: string | undefined,
    @Res() res: Response
  ) {
    await this.ac
      .user(user?.id ?? 'anonymous')
      .workspace(workspaceId)
      .assert('Workspace.Read');
    const { body, metadata, redirectUrl } = await this.storage.get(
      workspaceId,
      name,
      true
    );

    if (redirectUrl) {
      // redirect to signed url
      if (redirect === 'manual') {
        return res.send({
          url: redirectUrl,
        });
      } else {
        return res.redirect(redirectUrl);
      }
    }

    if (!body) {
      throw new BlobNotFound({
        spaceId: workspaceId,
        blobId: name,
      });
    }

    // metadata should always exists if body is not null
    if (metadata) {
      res.setHeader(
        'content-type',
        metadata.contentType.startsWith('application/json') // application/json is reserved for redirect url
          ? 'text/json'
          : metadata.contentType
      );
      res.setHeader('last-modified', metadata.lastModified.toUTCString());
      res.setHeader('content-length', metadata.contentLength);
    } else {
      this.logger.warn(`Blob ${workspaceId}/${name} has no metadata`);
    }

    res.setHeader('cache-control', 'public, max-age=2592000, immutable');
    body.pipe(res);
  }
}
