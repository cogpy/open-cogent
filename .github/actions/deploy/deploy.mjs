import { execSync } from 'node:child_process';

const {
  APP_VERSION,
  BUILD_TYPE,
  DEPLOY_HOST,
  CANARY_DEPLOY_HOST,
  GIT_SHORT_HASH,
  DATABASE_URL,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  GCLOUD_CONNECTION_NAME,
  CLOUD_SQL_IAM_ACCOUNT,
  APP_IAM_ACCOUNT,
  REDIS_SERVER_HOST,
  REDIS_SERVER_PASSWORD,
  STATIC_IP_NAME,
} = process.env;

const buildType = BUILD_TYPE || 'canary';

const isProduction = buildType === 'stable';
const isBeta = buildType === 'beta';
const isInternal = buildType === 'internal';

const replicaConfig = {
  stable: {
    web: 3,
    graphql: Number(process.env.PRODUCTION_GRAPHQL_REPLICA) || 3,
  },
  beta: {
    web: 2,
    graphql: Number(process.env.BETA_GRAPHQL_REPLICA) || 2,
  },
  canary: {
    web: 2,
    graphql: 2,
  },
};

const cpuConfig = {
  beta: {
    web: '300m',
    graphql: '1',
  },
  canary: {
    web: '300m',
    graphql: '1',
  },
};

const createHelmCommand = ({ isDryRun }) => {
  const flag = isDryRun ? '--dry-run' : '--atomic';
  const imageTag = `${buildType}-${GIT_SHORT_HASH}`;
  const redisAndPostgres =
    isProduction || isBeta || isInternal
      ? [
          `--set        cloud-sql-proxy.enabled=true`,
          `--set-string cloud-sql-proxy.database.connectionName="${GCLOUD_CONNECTION_NAME}"`,
          `--set-string global.database.host=${DATABASE_URL}`,
          `--set-string global.database.user=${DATABASE_USERNAME}`,
          `--set-string global.database.password=${DATABASE_PASSWORD}`,
          `--set-string global.database.name=${DATABASE_NAME}`,
          `--set-string global.redis.host="${REDIS_SERVER_HOST}"`,
          `--set-string global.redis.password="${REDIS_SERVER_PASSWORD}"`,
        ]
      : [];
  const serviceAnnotations = [
    `--set-json   web.serviceAccount.annotations="{ \\"iam.gke.io/gcp-service-account\\": \\"${APP_IAM_ACCOUNT}\\" }"`,
    `--set-json   graphql.serviceAccount.annotations="{ \\"iam.gke.io/gcp-service-account\\": \\"${APP_IAM_ACCOUNT}\\" }"`,
  ].concat(
    isProduction || isBeta || isInternal
      ? [
          `--set-json   web.service.annotations="{ \\"cloud.google.com/neg\\": \\"{\\\\\\"ingress\\\\\\": true}\\" }"`,
          `--set-json   graphql.service.annotations="{ \\"cloud.google.com/neg\\": \\"{\\\\\\"ingress\\\\\\": true}\\" }"`,
          `--set-json   cloud-sql-proxy.serviceAccount.annotations="{ \\"iam.gke.io/gcp-service-account\\": \\"${CLOUD_SQL_IAM_ACCOUNT}\\" }"`,
          `--set-json   cloud-sql-proxy.nodeSelector="{ \\"iam.gke.io/gke-metadata-server-enabled\\": \\"true\\" }"`,
        ]
      : []
  );

  const cpu = cpuConfig[buildType];
  const resources = cpu
    ? [
        `--set        web.resources.requests.cpu="${cpu.web}"`,
        `--set        graphql.resources.requests.cpu="${cpu.graphql}"`,
      ]
    : [];

  const replica = replicaConfig[buildType] || replicaConfig.canary;

  const namespace = isProduction
    ? 'production'
    : isBeta
      ? 'beta'
      : isInternal
        ? 'internal'
        : 'dev';

  const hosts = (DEPLOY_HOST || CANARY_DEPLOY_HOST)
    .split(',')
    .map(host => host.trim())
    .filter(host => host);
  const deployCommand = [
    `helm upgrade --install open-agent .github/helm/open-agent`,
    `--namespace  ${namespace}`,
    `--set-string global.deployment.type="open-agent"`,
    `--set-string global.deployment.platform="gcp"`,
    `--set-string global.app.buildType="${buildType}"`,
    `--set        global.ingress.enabled=true`,
    `--set-json   global.ingress.annotations="{ \\"kubernetes.io/ingress.class\\": \\"gce\\", \\"kubernetes.io/ingress.allow-http\\": \\"true\\", \\"kubernetes.io/ingress.global-static-ip-name\\": \\"${STATIC_IP_NAME}\\" }"`,
    ...hosts.map(
      (host, index) => `--set global.ingress.hosts[${index}]=${host}`
    ),
    `--set-string global.version="${APP_VERSION}"`,
    ...redisAndPostgres,
    `--set        web.replicaCount=${replica.web}`,
    `--set-string web.image.tag="${imageTag}"`,
    `--set        graphql.replicaCount=${replica.graphql}`,
    `--set-string graphql.image.tag="${imageTag}"`,
    `--set        graphql.app.host=${hosts[0]}`,
    ...serviceAnnotations,
    ...resources,
    `--timeout 10m`,
    flag,
  ].join(' ');
  return deployCommand;
};

const output = execSync(createHelmCommand({ isDryRun: true }), {
  encoding: 'utf-8',
  stdio: ['inherit', 'pipe', 'inherit'],
});
const templates = output
  .split('---')
  .filter(yml => !yml.split('\n').some(line => line.trim() === 'kind: Secret'))
  .join('---');
console.log(templates);

execSync(createHelmCommand({ isDryRun: false }), {
  encoding: 'utf-8',
  stdio: 'inherit',
});
