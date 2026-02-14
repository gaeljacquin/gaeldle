import { oc } from '@orpc/contract';
import { z } from 'zod';
import { GameSelectSchema, GameUpdateInputSchema, type Game } from './schema';

export const GameModeSlugSchema = z.enum([
  'cover-art',
  'image-ai',
  'artwork',
  'timeline',
  'timeline-2',
  'specifications',
]);

export const GamesContract = {
  list: oc
    .route({ method: 'GET', path: '/games' })
    .input(
      z.object({
        page: z.coerce.number().int().positive().optional(),
        pageSize: z.coerce.number().int().positive().optional(),
        q: z.string().optional(),
      }).optional(),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(GameSelectSchema),
        meta: z.object({
          page: z.number(),
          pageSize: z.number(),
          total: z.number(),
        }).optional(),
      }),
    ),

  get: oc
    .route({ method: 'GET', path: '/games/:igdbId' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),

  getArtwork: oc
    .route({ method: 'GET', path: '/games/artwork' })
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(GameSelectSchema),
      }),
    ),

  search: oc
    .route({ method: 'GET', path: '/games/search' })
    .input(
      z.object({
        q: z.string().min(2),
        limit: z.coerce.number().int().positive().optional().default(100),
        mode: GameModeSlugSchema.optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(GameSelectSchema),
      }),
    ),

  getRandom: oc
    .route({ method: 'GET', path: '/games/random' })
    .input(
      z.object({
        excludeIds: z.preprocess((val) => {
          if (!val) return [];
          return Array.isArray(val) ? val : [val];
        }, z.array(z.coerce.number())).optional(),
        mode: GameModeSlugSchema.optional(),
      }).optional(),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),

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
        operation: z.string(),
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
    .input(
      z.array(z.coerce.number().int().positive()),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({ deletedIds: z.array(z.number()) }),
      }),
    ),
} as const;

export interface GameApiResponse {
  success: boolean;
  data: Game | Game[];
  error?: string;
}

export type CoverArtModeSlug = 'cover-art' | 'image-ai' | 'artwork';

export type GameModeSlug =
  | CoverArtModeSlug
  | 'timeline'
  | 'timeline-2'
  | 'specifications';

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

// Specifications game types
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

export interface RevealedClue {
  field: keyof SpecificationGuess['matches'];
  value: string | string[];
  revealedAtGuessCount: number;
}
