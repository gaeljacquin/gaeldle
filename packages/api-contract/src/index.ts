import { oc } from '@orpc/contract';
import { GamesContract } from './game';
import { DiscoverContract } from './discover';
import { SampleContract } from './sample';
import { BigContract } from './big';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
  discover: DiscoverContract,
  big: BigContract,
  sample: SampleContract,
});

export * from './game';
export * from './schema';
export * from './discover';
export * from './big';
export * from './other';
