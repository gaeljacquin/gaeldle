import 'server-only';

import { StackServerApp } from '@hexclave/next';
import { stackClientApp } from '@/stack/client';

export const stackServerApp = new StackServerApp({
  inheritsFrom: stackClientApp,
});
