import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { contract } from '@gaeldle/api-contract';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import { inferRPCMethodFromContractRouter } from '@orpc/contract';
import type { ContractRouterClient } from '@orpc/contract';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

export const orpcClient = createORPCClient<ContractRouterClient<typeof contract>>(
  new RPCLink({
    url: API_BASE_URL,
    method: inferRPCMethodFromContractRouter(contract),
  }),
);

export const orpc = createORPCReactQueryUtils(orpcClient);
