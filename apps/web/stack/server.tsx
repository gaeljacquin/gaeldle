import "server-only";

import { StackServerApp } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";

export const stackServerApp = new StackServerApp({
  inheritsFrom: stackClientApp,
});
