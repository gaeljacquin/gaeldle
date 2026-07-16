import { oc } from '@orpc/contract';
import { GamesContract } from './game';
import { DiscoverContract } from './discover';
import { SampleContract } from './sample';
import { ImageGenContract } from './image-gen';
import { ClueContract } from './clue';

export const contract = oc.prefix('/api').router({
  games: GamesContract,
  discover: DiscoverContract,
  imageGen: ImageGenContract,
  clue: ClueContract,
  sample: SampleContract,
});

export * from './game';
export * from './schema';
export * from './discover';
export * from './image-gen';
export * from './clue';
export * from './other';
