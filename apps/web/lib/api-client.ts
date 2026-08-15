import { createApiClient } from '@workspace/api-client';
import { hexclaveClientApp } from '@/hexclave/client';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const apiClient = createApiClient({
  baseUrl: process.env.apiUrl || '',
  fetch: async (request: Request, init?: RequestInit) => {
    const headers = new Headers(request?.headers);

    try {
      if (init?.signal?.aborted) {
        throw init.signal.reason || new Error('Aborted');
      }

      const user = await hexclaveClientApp.getUser({ or: 'return-null' });

      if (user) {
        const authorizationHeader = await user.getAuthorizationHeader();

        if (authorizationHeader) {
          headers.set('Authorization', authorizationHeader);
        }
      }

      const response = await fetchWithTimeout(request, {
        ...init,
        headers,
        signal: init?.signal,
        mode: 'cors',
        timeout: 60000,
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
});
