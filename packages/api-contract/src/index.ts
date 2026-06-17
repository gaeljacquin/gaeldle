import { oc } from '@orpc/contract';
import { GamesContract } from './game';
import { DiscoverContract } from './discover';
import { SampleContract } from './sample';
import { ImageGenContract } from './image-gen';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
  discover: DiscoverContract,
  imageGen: ImageGenContract,
  sample: SampleContract,
});

export * from './game';
export * from './schema';
export * from './discover';
export * from './image-gen';
export * from './other';
