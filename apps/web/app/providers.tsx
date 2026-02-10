"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import type { ReactNode } from "react";
import { useState } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: Readonly<ProvidersProps>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </StackTheme>
    </StackProvider>
  );
}
