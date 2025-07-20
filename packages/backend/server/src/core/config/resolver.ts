import {
  Args,
  Field,
  GraphQLISODateTime,
  InputType,
  Mutation,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-scalars';

import { Config, URLHelper } from '../../base';
import { Feature } from '../../models';
import { CurrentUser, Public } from '../auth';
import { Admin } from '../common';
import { AvailableUserFeatureConfig } from '../features';
import { ServerService } from './service';
import { ServerConfigType } from './types';

@ObjectType()
export class PasswordLimitsType {
  @Field()
  minLength!: number;
  @Field()
  maxLength!: number;
}

@ObjectType()
export class CredentialsRequirementType {
  @Field()
  password!: PasswordLimitsType;
}

@ObjectType()
export class ReleaseVersionType {
  @Field()
  version!: string;

  @Field()
  url!: string;

  @Field(() => GraphQLISODateTime)
  publishedAt!: Date;

  @Field()
  changelog!: string;
}

@Resolver(() => ServerConfigType)
export class ServerConfigResolver {
  constructor(
    private readonly config: Config,
    private readonly url: URLHelper,
    private readonly server: ServerService
  ) {}

  @Public()
  @Query(() => ServerConfigType, {
    description: 'server config',
  })
  serverConfig(): ServerConfigType {
    return {
      name:
        this.config.server.name ??
        (env.namespaces.canary
          ? 'Agent Server Canary'
          : env.namespaces.beta
            ? 'Agent Server Beta'
            : 'Agent Server'),
      version: env.version,
      baseUrl: this.url.requestBaseUrl,
      type: env.DEPLOYMENT_TYPE,
      features: this.server.features,
      // TODO(@fengmk2): remove this field after the feature 0.25.0 is released
      allowGuestDemoWorkspace: this.config.flags.allowGuestDemoWorkspace,
    };
  }

  @ResolveField(() => CredentialsRequirementType, {
    description: 'credentials requirement',
  })
  async credentialsRequirement() {
    return {
      password: {
        minLength: this.config.auth.passwordRequirements.min,
        maxLength: this.config.auth.passwordRequirements.max,
      },
    };
  }

  @ResolveField(() => Boolean, {
    description: 'whether server has been initialized',
  })
  async initialized() {
    return this.server.initialized();
  }
}

@Resolver(() => ServerConfigType)
export class ServerFeatureConfigResolver extends AvailableUserFeatureConfig {
  @ResolveField(() => [Feature], {
    description: 'Features for user that can be configured',
  })
  override availableUserFeatures() {
    return super.availableUserFeatures();
  }
}

@InputType()
class UpdateAppConfigInput {
  @Field()
  module!: string;

  @Field()
  key!: string;

  @Field(() => GraphQLJSON)
  value!: any;
}

@ObjectType()
class AppConfigValidateResult {
  @Field()
  module!: string;

  @Field()
  key!: string;

  @Field(() => GraphQLJSON)
  value!: any;

  @Field()
  valid!: boolean;

  @Field(() => String, { nullable: true })
  error?: string;
}

@Admin()
@Resolver(() => GraphQLJSONObject)
export class AppConfigResolver {
  constructor(private readonly service: ServerService) {}

  @Query(() => GraphQLJSONObject, {
    description: 'get the whole app configuration',
  })
  appConfig() {
    return this.service.getConfig();
  }

  @Mutation(() => GraphQLJSONObject, {
    description: 'update app configuration',
  })
  async updateAppConfig(
    @CurrentUser() me: CurrentUser,
    @Args('updates', { type: () => [UpdateAppConfigInput] })
    updates: UpdateAppConfigInput[]
  ): Promise<DeepPartial<AppConfig>> {
    return await this.service.updateConfig(me.id, updates);
  }

  @Mutation(() => [AppConfigValidateResult], {
    description: 'validate app configuration',
  })
  async validateAppConfig(
    @Args('updates', { type: () => [UpdateAppConfigInput] })
    updates: UpdateAppConfigInput[]
  ): Promise<AppConfigValidateResult[]> {
    const errors = this.service.validateConfig(updates);

    return updates.map(update => {
      const error = errors?.find(
        error =>
          error.data.module === update.module && error.data.key === update.key
      );
      return {
        module: update.module,
        key: update.key,
        value: update.value,
        valid: !error,
        error: error?.data.hint,
      };
    });
  }
}
