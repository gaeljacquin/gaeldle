import { createORPCClient } from '@orpc/client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { contract } from '@gaeldle/api-contract';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { JsonifiedClient } from '@orpc/openapi-client';
import type { ContractRouterClient } from '@orpc/contract';

export const orpcClient = createORPCClient<JsonifiedClient<ContractRouterClient<typeof contract>>>(
  new OpenAPILink(contract, {
    url: `${process.env.serverUrl || 'http://localhost:8080'}`,
  }),
);

export const orpc = createORPCReactQueryUtils(orpcClient);
