import { oc } from '@orpc/contract';
import { z } from 'zod';
import { GameSelectSchema, GameUpdateInputSchema, type Game } from './schema';
import { DotPaths } from './other';

export const SyncOperationSchema = z.enum([
  'created',
  'updated',
  // 'no_change',
]);

export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const GamesContract = {
  sync: oc
    .route({ method: 'POST', path: '/games/sync' })
    .input(
      z.object({
        igdb_id: z.coerce.number().int().positive(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        operation: SyncOperationSchema,
        data: GameSelectSchema,
      }),
    ),

  update: oc
    .route({ method: 'PATCH', path: '/games/:id' })
    .input(
      z.object({
        id: z.coerce.number().int().positive(),
        updates: GameUpdateInputSchema,
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),

  delete: oc
    .route({ method: 'DELETE', path: '/games/:id' })
    .input(
      z.object({
        id: z.coerce.number().int().positive(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({ id: z.number() }),
      }),
    ),

  deleteBulk: oc
    .route({ method: 'DELETE', path: '/games/bulk' })
    .input(z.array(z.coerce.number().int().positive()))
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({ deletedIds: z.array(z.number()) }),
      }),
    ),

  testUpload: oc
    .route({ method: 'POST', path: '/games/test-upload' })
    .input(
      z.object({
        image: z.string(), // base64
        extension: z.string().default('jpg'),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
      }),
    ),

  validateIgdbIdAdd: oc
    .route({ method: 'POST', path: '/games/add/validate-one' })
    .input(
      z.object({
        igdbId: z.number().int().positive(),
      }),
    )
    .output(
      z.object({
        igdbId: z.number(),
        existsOnIgdb: z.boolean(),
        alreadyInDb: z.boolean(),
        gameName: z.string().nullable(),
        canAdd: z.boolean(),
      }),
    ),

  testSendMessage: oc
    .route({ method: 'POST', path: '/test/send-message' })
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
      }),
    ),
} as const;

export interface GameApiResponse {
  success: boolean;
  data: Game | Game[];
  error?: string;
}

export interface ArtworkImage {
  url: string;
  image_id: string;
}

export interface GameState {
  targetGame: Game | null;
  selectedGameId: number | null;
  wrongGuesses: number[];
  attemptsLeft: number;
  isGameOver: boolean;
  isCorrect: boolean;
  currentPixelSize: number;
}

export type MatchType = 'exact' | 'partial' | 'none';

export interface CellMatch {
  type: MatchType;
  value: string | string[] | null;
}

export interface SpecificationGuess {
  gameId: number;
  gameName: string;
  imageUrl: string | null;
  aiImageUrl: string | null;
  matches: {
    platforms: CellMatch;
    genres: CellMatch;
    themes: CellMatch;
    releaseDate: CellMatch;
    gameModes: CellMatch;
    gameEngines: CellMatch;
    publisher: CellMatch;
    perspective: CellMatch;
  };
}

export type MatchKey = keyof SpecificationGuess['matches'];

export interface RevealedClue {
  field: keyof SpecificationGuess['matches'];
  value: string | string[];
  revealedAtGuessCount: number;
}

export type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  url?: string;
  total_rating?: number;
  total_rating_count?: number;
  first_release_date?: number;
  cover?: { image_id?: string; url?: string };
  artworks?: Array<{ image_id?: string; url?: string }>;
  keywords?: Array<{ name?: string }>;
  franchises?: Array<{ name?: string }>;
  game_engines?: Array<{ name?: string }>;
  game_modes?: Array<{ name?: string }>;
  genres?: Array<{ name?: string }>;
  involved_companies?: Array<{
    company?: { name?: string };
    publisher?: boolean;
    developer?: boolean;
  }>;
  platforms?: Array<{ name?: string }>;
  player_perspectives?: Array<{ name?: string }>;
  release_dates?: Array<{
    human?: string;
    date?: number;
    platform?: { name?: string };
  }>;
  themes?: Array<{ id?: number; name?: string }>;
  category?: number;
  status?: number;
};

export type IgdbGameField = DotPaths<IgdbGame>;
