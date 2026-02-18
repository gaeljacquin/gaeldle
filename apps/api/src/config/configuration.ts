export type AppConfiguration = {
  appEnv: string;
  port: number;
  clientPort: number;
  corsAllowedOrigins: string[];
  stackProjectId: string;
  stackPublishableClientKey: string;
  stackSecretServerKey: string;
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
};

const configuration = (): AppConfiguration => {
  const appEnv = (
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    'development'
  ).toLowerCase();

  const portRaw = process.env.PORT ?? process.env.SERVER_PORT ?? '8080';
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
    stackProjectId: process.env.STACK_PROJECT_ID ?? '',
    stackPublishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY ?? '',
    stackSecretServerKey: process.env.STACK_SECRET_SERVER_KEY ?? '',
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
  };
};
export default configuration;
