import createClient from 'openapi-fetch';
export function createApiClient(options = {}) {
  return createClient(options);
}
export const apiClient = createApiClient();
