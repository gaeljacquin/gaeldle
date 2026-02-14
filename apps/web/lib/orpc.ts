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
    fetch: async (url, init: any) => {
      const headers = new Headers();

      // Merge existing headers
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value: string, key: string) => headers.set(key, value));
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]: [string, string]) => headers.set(key, value));
        } else {
          Object.entries(init.headers).forEach(([key, value]) => headers.set(key, value as string));
        }
      }

      try {
        const user = await stackClientApp.getUser({ or: 'return-null' });
        if (user) {
          const authHeaders = await user.getAuthHeaders();
          Object.entries(authHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });

          // Also set the token explicitly in x-stack-access-token just in case
          const authJson = await user.getAuthJson();
          if (authJson.accessToken) {
            headers.set('x-stack-access-token', authJson.accessToken);
          }
        }
      } catch (e) {
        console.error('Failed to get auth headers', e);
      }

      try {
        const response = await fetch(url, {
          ...init,
          headers,
          mode: 'cors',
        });
        return response;
      } catch (e) {
        console.error(`Fetch failed for ${url}:`, e);
        throw e;
      }
    },
  }),
);

export const orpc = createORPCReactQueryUtils(orpcClient);
