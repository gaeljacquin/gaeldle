import { Game } from '@/services/games';

export type CheckAnswer = string | number | number[] | Partial<Game> | Partial<Game>[];
