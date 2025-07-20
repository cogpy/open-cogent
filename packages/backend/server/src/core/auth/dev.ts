import { Models, UserFeatureName } from '../../models';

export async function createDevUsers(models: Models) {
  const devUsers: {
    email: string;
    name: string;
    password: string;
    features: UserFeatureName[];
  }[] = [
    {
      email: 'dev@affine.pro',
      name: 'Dev User',
      password: 'dev',
      features: ['free_plan_v1', 'unlimited_copilot'],
    },
    {
      email: 'pro@affine.pro',
      name: 'Pro User',
      password: 'pro',
      features: ['pro_plan_v1', 'unlimited_copilot'],
    },
  ];

  for (const { email, name, password, features } of devUsers) {
    try {
      let devUser = await models.user.getUserByEmail(email);
      if (!devUser) {
        devUser = await models.user.create({
          email,
          name,
          password,
        });
      }
      for (const feature of features) {
        if (feature.includes('plan')) {
          await models.userFeature.switchQuota(devUser.id, feature, name);
        } else {
          await models.userFeature.add(devUser.id, feature, name);
        }
      }
    } catch {
      // ignore
    }
  }
}
