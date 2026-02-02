export const config = {
  port: process.env.PORT || process.env.SERVER_PORT || 8080,
  clientPort: process.env.CLIENT_PORT || 3000,
  stackProjectId: process.env.STACK_PROJECT_ID || '',
  stackPublishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY || '',
  stackSecretServerKey: process.env.STACK_SECRET_SERVER_KEY || '',
} as const;

export const getCorsOrigins = () => {
  if (process.env.CORS_ALLOWED_ORIGINS) {
    return process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // Default origins based on client port
  return [
    `http://localhost:${config.clientPort}`,
    `http://127.0.0.1:${config.clientPort}`,
    `http://web:${config.clientPort}` // Docker container name
  ];
};
