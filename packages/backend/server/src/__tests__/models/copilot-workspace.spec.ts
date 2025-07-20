import { PrismaClient, User } from '@prisma/client';
import ava, { TestFn } from 'ava';

import { Config } from '../../base';
import { CopilotContextModel } from '../../models/copilot-context';
import { CopilotUserConfigModel } from '../../models/copilot-user';
import { UserModel } from '../../models/user';
import { createTestingModule, type TestingModule } from '../utils';
import { cleanObject } from '../utils/copilot';

interface Context {
  config: Config;
  module: TestingModule;
  db: PrismaClient;
  user: UserModel;
  copilotContext: CopilotContextModel;
  copilotUser: CopilotUserConfigModel;
}

const test = ava as TestFn<Context>;

test.before(async t => {
  const module = await createTestingModule();
  t.context.user = module.get(UserModel);
  t.context.copilotContext = module.get(CopilotContextModel);
  t.context.copilotUser = module.get(CopilotUserConfigModel);
  t.context.db = module.get(PrismaClient);
  t.context.config = module.get(Config);
  t.context.module = module;
});

let user: User;

test.beforeEach(async t => {
  await t.context.module.initTestingDB();
  user = await t.context.user.create({
    email: 'test@affine.pro',
  });
});

test.after(async t => {
  await t.context.module.close();
});

test('should insert and search embedding', async t => {
  {
    const { fileId } = await t.context.copilotUser.addFile(user.id, {
      fileName: 'file1',
      blobId: 'blob1',
      mimeType: 'text/plain',
      size: 1,
    });
    await t.context.copilotUser.insertFileEmbeddings(user.id, fileId, [
      {
        index: 0,
        content: 'content',
        embedding: Array.from({ length: 1024 }, () => 1),
      },
    ]);

    {
      const ret = await t.context.copilotUser.matchFileEmbedding(
        Array.from({ length: 1024 }, () => 0.9),
        user.id,
        1,
        1
      );
      t.snapshot(
        cleanObject(ret, ['fileId']),
        'should match workspace file embedding'
      );
    }
  }
});
