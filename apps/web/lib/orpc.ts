import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { contract } from '@gaeldle/api-contract';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import { inferRPCMethodFromContractRouter } from '@orpc/contract';
import type { ContractRouterClient } from '@orpc/contract';

export const orpcClient = createORPCClient<ContractRouterClient<typeof contract>>(
  new RPCLink({
    url: process.env.serverUrl || 'http://localhost:8080',
    method: inferRPCMethodFromContractRouter(contract),
  }),
);

export const orpc = createORPCReactQueryUtils(orpcClient);
