import { Game } from '~/types/games';

export class ModeMap extends Map<string, Game> {
  constructor() {
    super();
  }
}
