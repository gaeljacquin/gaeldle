import { oc } from '@orpc/contract';
import { GamesContract } from './games';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
});

export * from './games';
export * from './schema';
