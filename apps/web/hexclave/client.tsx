import { HexclaveClientApp } from '@hexclave/next';

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: 'nextjs-cookie',
  projectId:
    process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID ||
    'a0000000-0000-4000-8000-000000000000',
  publishableClientKey:
    process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY ||
    'pck_00000000000000000000000000000000',
  baseUrl: process.env.NEXT_PUBLIC_HEXCLAVE_API_URL,
});
