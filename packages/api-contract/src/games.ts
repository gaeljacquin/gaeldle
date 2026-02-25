import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  GameSelectSchema,
  GameUpdateInputSchema,
  BulkJobFailureSchema,
  BulkJobParamsSchema,
  BulkJobStatusEnum,
  type Game,
} from './schema';
import { DEFAULT_IMAGE_GEN_STYLE, IMAGE_GEN_MIN, IMAGE_GEN_MAX } from '@gaeldle/constants';

export const GameModeSlugSchema = z.enum([
  'cover-art',
  'image-gen',
  'artwork',
  'timeline',
  'timeline-2',
  'specifications',
]);

export const ImageStyleSchema = z.enum([
  'funko-pop-chibi',
  'simpsons',
  'rubber-hose-animation',
  'muppet',
  'lego',
  'claymation',
  'vector-art',
  'digital-cel-shaded',
  'western-animation-concept-art',
  'graphic-novel-illustration',
]);
export type ImageStyle = z.infer<typeof ImageStyleSchema>;

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
    .input(
      z.array(z.coerce.number().int().positive()),
    )
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

  generateImage: oc
    .route({ method: 'POST', path: '/games/generate-image' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        includeStoryline: z.boolean().optional().default(false),
        includeGenres: z.boolean().optional().default(false),
        includeThemes: z.boolean().optional().default(false),
        imageStyle: ImageStyleSchema.optional().default(DEFAULT_IMAGE_GEN_STYLE),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
        data: GameSelectSchema,
      }),
    ),
  bulkGenerateImages: oc
    .route({ method: 'POST', path: '/games/bulk-generate-images' })
    .input(
      z.object({
        numGames: z.number().int().min(IMAGE_GEN_MIN).max(IMAGE_GEN_MAX),
        imageStyle: ImageStyleSchema,
        includeStoryline: z.boolean().default(false),
        includeGenres: z.boolean().default(false),
        includeThemes: z.boolean().default(false),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        jobId: z.string(),
        gamesQueued: z.number(),
      }),
    ),

  getBulkJobStatus: oc
    .route({ method: 'GET', path: '/games/bulk-generate-images/:jobId/status' })
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        jobId: z.string(),
        status: BulkJobStatusEnum,
        total: z.number(),
        processed: z.number(),
        succeeded: z.number(),
        failed: z.number(),
        failures: z.array(BulkJobFailureSchema),
        params: BulkJobParamsSchema,
        startedAt: z.date().nullable(),
        completedAt: z.date().nullable(),
        createdAt: z.date(),
      }),
    ),


} as const;

export interface GameApiResponse {
  success: boolean;
  data: Game | Game[];
  error?: string;
}

export type CoverArtModeSlug = 'cover-art' | 'image-gen' | 'artwork';

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
