import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths, components } from './schema';

export type { paths, components };
export type Schemas = components extends { schemas: infer S }
  ? S
  : Record<string, never>;

export type CreateApiClientOptions = ClientOptions;

export function createApiClient(options: CreateApiClientOptions = {}) {
  return createClient<paths>(options);
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const apiClient = createApiClient();
