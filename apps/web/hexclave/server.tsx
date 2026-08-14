import 'server-only';

import { HexclaveServerApp } from '@hexclave/next';
import { hexclaveClientApp } from '@/hexclave/client';

export const hexclaveServerApp = new HexclaveServerApp({
  inheritsFrom: hexclaveClientApp,
  secretServerKey:
    process.env.HEXCLAVE_SECRET_SERVER_KEY ||
    'ssk_00000000000000000000000000000000',
});
