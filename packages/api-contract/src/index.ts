import { oc } from '@orpc/contract';
import { GamesContract } from './games';
import { DiscoverContract } from './discover';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
  discover: DiscoverContract,
});

export * from './games';
export * from './schema';
export * from './discover';
