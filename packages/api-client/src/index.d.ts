import { type ClientOptions } from 'openapi-fetch';
import type { paths, components } from './schema';
export type { paths, components };
export type Schemas = components extends {
  schemas: infer S;
}
  ? S
  : Record<string, never>;
export type CreateApiClientOptions = ClientOptions;
export declare function createApiClient(
  options?: CreateApiClientOptions,
): import('openapi-fetch').Client<paths, `${string}/${string}`>;
export type ApiClient = ReturnType<typeof createApiClient>;
export declare const apiClient: import('openapi-fetch').Client<
  paths,
  `${string}/${string}`
>;
