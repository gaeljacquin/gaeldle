import { Game, Games } from '@/types/games';

export class ModeMap extends Map<string, Game | Games> {
  constructor() {
    super();
  }
}
