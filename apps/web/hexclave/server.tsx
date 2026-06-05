import 'server-only';

import { HexclaveServerApp } from '@hexclave/next';
import { hexclaveClientApp } from '@/hexclave/client';

export const hexclaveServerApp = new HexclaveServerApp({
  inheritsFrom: hexclaveClientApp,
});
