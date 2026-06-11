import { oc } from '@orpc/contract';
import { GamesContract } from './games';
import { DiscoverContract } from './discover';
import { SampleContract } from './sample';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
  discover: DiscoverContract,
  sample: SampleContract,
});

export * from './games';
export * from './schema';
export * from './discover';
export * from './other';
