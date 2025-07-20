import { z } from 'zod';

import { OneGB, OneMB } from '../../base';

const UserPlanQuotaConfig = z.object({
  // quota name
  name: z.string(),
  // single blob limit
  blobLimit: z.number(),
  // total blob limit
  storageQuota: z.number(),
  // copilot limit
  copilotLimit: z.number().optional(),
});

export type UserQuota = z.infer<typeof UserPlanQuotaConfig>;

export enum FeatureType {
  Feature,
  Quota,
}

export enum Feature {
  FreePlan = 'free_plan_v1',
  ProPlan = 'pro_plan_v1',
}

export const FeaturesShapes = {
  free_plan_v1: UserPlanQuotaConfig,
  pro_plan_v1: UserPlanQuotaConfig,
} satisfies Record<Feature, z.ZodObject<any>>;

export type UserFeatureName = keyof Pick<
  typeof FeaturesShapes,
  'free_plan_v1' | 'pro_plan_v1'
>;
export type FeatureName = UserFeatureName;
export type FeatureConfig<T extends FeatureName> = z.infer<
  (typeof FeaturesShapes)[T]
>;

export const FeatureConfigs: {
  [K in FeatureName]: {
    type: FeatureType;
    configs: FeatureConfig<K>;
  };
} = {
  free_plan_v1: {
    type: FeatureType.Quota,
    configs: {
      // quota name
      name: 'Free',
      blobLimit: 10 * OneMB,
      storageQuota: 10 * OneGB,
      copilotLimit: undefined,
    },
  },
  pro_plan_v1: {
    type: FeatureType.Quota,
    configs: {
      name: 'Pro',
      blobLimit: 100 * OneMB,
      storageQuota: 100 * OneGB,
      copilotLimit: undefined,
    },
  },
};
