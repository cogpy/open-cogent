import {
  ExistingProvider,
  FactoryProvider,
  Global,
  Module,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { ApplyType } from '../base';
import { BlobModel } from './blob';
import { CommentModel } from './comment';
import { CommentAttachmentModel } from './comment-attachment';
import { AppConfigModel } from './config';
import { CopilotContextModel } from './copilot-context';
import { CopilotJobModel } from './copilot-job';
import { CopilotSessionModel } from './copilot-session';
import { CopilotUserConfigModel } from './copilot-user';
import { DocUserModel } from './doc-user';
import { FeatureModel } from './feature';
import { HistoryModel } from './history';
import { MODELS_SYMBOL } from './provider';
import { SessionModel } from './session';
import { UserModel } from './user';
import { UserDocModel } from './user-doc';
import { UserFeatureModel } from './user-feature';
import { UserSettingsModel } from './user-settings';
import { VerificationTokenModel } from './verification-token';

const MODELS = {
  user: UserModel,
  session: SessionModel,
  verificationToken: VerificationTokenModel,
  feature: FeatureModel,
  userFeature: UserFeatureModel,
  userDoc: UserDocModel,
  docUser: DocUserModel,
  history: HistoryModel,
  userSettings: UserSettingsModel,
  copilotSession: CopilotSessionModel,
  copilotContext: CopilotContextModel,
  copilotUser: CopilotUserConfigModel,
  copilotJob: CopilotJobModel,
  appConfig: AppConfigModel,
  comment: CommentModel,
  commentAttachment: CommentAttachmentModel,
  blob: BlobModel,
};

type ModelsType = {
  [K in keyof typeof MODELS]: InstanceType<(typeof MODELS)[K]>;
};

export class Models extends ApplyType<ModelsType>() {}

const ModelsProvider: FactoryProvider = {
  provide: Models,
  useFactory: (ref: ModuleRef) => {
    return new Proxy({} as any, {
      get: (target, prop) => {
        // cache
        if (prop in target) {
          return target[prop];
        }

        // find the model instance
        // @ts-expect-error null detection happens right after
        const Model = MODELS[prop];
        if (!Model) {
          return undefined;
        }

        const model = ref.get(Model);

        if (!model) {
          throw new Error(`Failed to initialize model ${Model.name}`);
        }

        target[prop] = model;
        return model;
      },
    });
  },
  inject: [ModuleRef],
};

const ModelsSymbolProvider: ExistingProvider = {
  provide: MODELS_SYMBOL,
  useExisting: Models,
};

@Global()
@Module({
  providers: [...Object.values(MODELS), ModelsProvider, ModelsSymbolProvider],
  exports: [ModelsProvider],
})
export class ModelsModule {}

export * from './blob';
export * from './comment';
export * from './comment-attachment';
export * from './common';
export * from './copilot-context';
export * from './copilot-job';
export * from './copilot-session';
export * from './copilot-user';
export * from './doc-user';
export * from './feature';
export * from './history';
export * from './session';
export * from './user';
export * from './user-doc';
export * from './user-feature';
export * from './user-settings';
export * from './verification-token';
