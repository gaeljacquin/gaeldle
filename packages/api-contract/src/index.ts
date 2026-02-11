import { oc } from '@orpc/contract';
import { GamesContract } from './games';

export const contract = oc.router({
  games: GamesContract,
});

export * from './games';
export * from './schema';
