"use client";

import { MagicLinkSignIn } from "@stackframe/stack";

export default function SignInView() {
  return (
    <div className="w-full min-h-full">
      <div className="max-w-xl mx-auto p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Sign in</h1>
            <p className="text-muted-foreground">
              Access your Gaeldle account.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <MagicLinkSignIn />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
