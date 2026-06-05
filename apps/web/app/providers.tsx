'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HexclaveProvider } from '@hexclave/next';
import { hexclaveClientApp } from '@/hexclave/client';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { TooltipProvider } from "@workspace/ui/tooltip";

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
      }),
  );

  return (
    <HexclaveProvider app={hexclaveClientApp}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" closeButton richColors />
          <ReactQueryDevtools initialIsOpen={false} />
        </TooltipProvider>
      </QueryClientProvider>
    </HexclaveProvider>
  );
}
