export type AppConfiguration = {
  appEnv: string;
  port: number;
  clientPort: number;
  corsAllowedOrigins: string[];
  hexclaveProjectId: string;
  hexclavePublishableClientKey: string;
  hexclaveSecretServerKey: string;
  databaseUrl: string;
  twitchClientId: string;
  twitchClientSecret: string;
  r2Endpoint: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicUrl: string;
  cfAccountId: string;
  cfApiToken: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  sampleSqsQueueUrl: string;
};

const configuration = (): AppConfiguration => {
  const appEnv = (
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    'development'
  ).toLowerCase();

  const portRaw = process.env.PORT ?? process.env.SERVER_PORT ?? '3000';
  const port = Number.parseInt(portRaw, 10) || 8080;

  const clientPortRaw = process.env.CLIENT_PORT ?? '3000';
  const clientPort = Number.parseInt(clientPortRaw, 10) || 3000;

  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        `http://localhost:${clientPort}`,
        `http://127.0.0.1:${clientPort}`,
        `http://web:${clientPort}`,
      ];

  return {
    appEnv,
    port,
    clientPort,
    corsAllowedOrigins,
    hexclaveProjectId: process.env.HEXCLAVE_PROJECT_ID ?? '',
    hexclavePublishableClientKey:
      process.env.HEXCLAVE_PUBLISHABLE_CLIENT_KEY ?? '',
    hexclaveSecretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY ?? '',
    databaseUrl: process.env.DATABASE_URL ?? '',
    twitchClientId: process.env.TWITCH_CLIENT_ID ?? '',
    twitchClientSecret: process.env.TWITCH_CLIENT_SECRET ?? '',
    r2Endpoint: process.env.R2_ENDPOINT ?? '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    r2BucketName: process.env.R2_BUCKET_NAME ?? 'gaeldle-image-gen',
    r2PublicUrl: process.env.R2_PUBLIC_URL ?? '',
    cfAccountId: process.env.CF_ACCOUNT_ID ?? '',
    cfApiToken: process.env.CF_API_TOKEN ?? '',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    awsRegion: process.env.AWS_REGION ?? '',
    sampleSqsQueueUrl:
      process.env.SAMPLE_SQS_QUEUE_URL ?? 'gaeldle-sample-queue',
  };
};
export default configuration;
