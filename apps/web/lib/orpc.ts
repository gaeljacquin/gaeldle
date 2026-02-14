import { createORPCClient } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { contract } from '@gaeldle/api-contract';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';
import { stackClientApp } from '@/stack/client';

export const orpcClient = createORPCClient<JsonifiedClient<ContractRouterClient<typeof contract>>>(
  new OpenAPILink(contract, {
    url: `${process.env.serverUrl || 'http://localhost:8080'}`,
    fetch: async (request: Request, init: { redirect?: RequestRedirect }) => {
      const headers = new Headers(request.headers);
      const signal = request.signal;

      try {
        if (signal?.aborted) {
          throw signal.reason || new Error('Aborted');
        }

        const user = await stackClientApp.getUser({ or: 'return-null' });

        if (user) {
          const authHeaders = await user.getAuthHeaders();
          Object.entries(authHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });

          // Also set the token explicitly just in case some middleware prefers it
          const accessToken = await user.getAccessToken();
          if (accessToken) {
            headers.set('x-stack-access-token', accessToken);
          }
        }

        const response = await fetch(request, {
          ...init,
          headers,
          signal,
          mode: 'cors',
        });
        return response;
      } catch (e) {
        if (
          e instanceof Error &&
          (e.message === 'Aborted' || e.name === 'AbortError')
        ) {
          throw e;
        }

        console.error(`Fetch failed for ${request.url}:`, e);
        throw e;
      }
    },
  }),
);

export const orpc = createORPCReactQueryUtils(orpcClient);
