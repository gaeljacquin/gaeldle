import { HexclaveClientApp } from '@hexclave/next';

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: 'nextjs-cookie',
  projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  baseUrl: process.env.NEXT_PUBLIC_HEXCLAVE_API_URL,
});
