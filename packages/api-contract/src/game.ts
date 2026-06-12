import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  GameSelectSchema,
  GameUpdateInputSchema,
  BulkJobFailureSchema,
  BulkJobParamsSchema,
  BulkJobStatusEnum,
  type Game,
  artStyleSelectSchema,
} from './schema';
import { IMAGE_GEN_MIN, IMAGE_GEN_MAX } from '@workspace/shared';
import { DotPaths } from './other';

export const coverArtModeSlugs = ['cover-art', 'image-gen', 'artwork'];

export const gameModeSlugs = [
  ...coverArtModeSlugs,
  'timeline',
  'timeline-2',
  'specifications',
];

export type GameModeSlug = (typeof gameModeSlugs)[number];

export type CoverArtModeSlug = (typeof coverArtModeSlugs)[number];

export interface GameMode {
  id: GameModeSlug;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gradient: string;
  href: string;
}

export const gameModes: GameMode[] = [
  {
    id: 'cover-art',
    title: 'Cover Art',
    description: 'Identify the game from their cover art.',
    difficulty: 'Easy',
    gradient: '--gradient-easy',
    href: '/cover-art',
  },
  {
    id: 'artwork',
    title: 'Artwork',
    description: 'Guess the game from their artwork.',
    difficulty: 'Medium',
    gradient: '--gradient-medium-1',
    href: '/artwork',
  },
  {
    id: 'image-gen',
    title: 'Image Gen',
    description: 'Guess the game from a text-to-image rendition.',
    difficulty: 'Medium',
    gradient: '--gradient-medium-2',
    href: '/image-gen',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Arrange games in chronological order.',
    difficulty: 'Medium',
    gradient: '--gradient-medium-3',
    href: '/timeline',
  },
  {
    id: 'timeline-2',
    title: 'Timeline 2',
    description: 'Place each game in chronological order.',
    difficulty: 'Hard',
    gradient: '--gradient-hard-1',
    href: '/timeline-2',
  },
  {
    id: 'specifications',
    title: 'Specifications',
    description: 'Deduce the game from their specifications.',
    difficulty: 'Hard',
    gradient: '--gradient-hard-2',
    href: '/specifications',
  },
];

export const GameModeSlugSchema = z.enum(
  gameModes.map((gameMode) => {
    return gameMode.id;
  }),
);

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

  generateImage: oc
    .route({ method: 'POST', path: '/games/generate-image' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        includeStoryline: z.boolean().optional().default(false),
        includeGenres: z.boolean().optional().default(false),
        includeThemes: z.boolean().optional().default(false),
        artStyle: artStyleSelectSchema.shape.value.optional(), // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
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
        artStyle: artStyleSelectSchema.shape.value, // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
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

  validateReplaceGame: oc
    .route({ method: 'POST', path: '/games/replace-game/validate-one' })
    .input(
      z.object({
        current: z.number().int().positive(),
        replacement: z.number().int().positive(),
      }),
    )
    .output(
      z.object({
        current: z.number(),
        replacement: z.number(),
        currentExistsInDb: z.boolean(),
        currentGameName: z.string().nullable(),
        replacementExistsOnIgdb: z.boolean(),
        replacementAlreadyInDb: z.boolean(),
        replacementGameName: z.string().nullable(),
        canApply: z.boolean(),
      }),
    ),

  replaceGames: oc
    .route({ method: 'POST', path: '/games/replace-games' })
    .input(
      z
        .array(
          z
            .object({
              current: z.number().int().positive(),
              replacement: z.number().int().positive(),
            })
            .refine((p) => p.current !== p.replacement, {
              message: 'IDs must differ',
            }),
        )
        .min(1)
        .max(20),
    )
    .output(
      z.object({
        success: z.boolean(),
        results: z.array(
          z.object({
            current: z.number(),
            replacement: z.number(),
            status: z.enum(['updated', 'skipped', 'error']),
            message: z.string(),
            gameName: z.string().nullable(),
          }),
        ),
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

export type ResultStatus = 'updated' | 'skipped' | 'error';

export type ReplaceGameResult = {
  current: number;
  replacement: number;
  status: ResultStatus;
  message: string;
  gameName: string | null;
};

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

/**
 * Get game mode by slug (pathname without leading slash)
 * @param slug - The game mode slug (e.g., "cover-art", "image-gen")
 * @returns GameMode or undefined if not found
 */
export function getGameModeBySlug(slug: string): GameMode | undefined {
  return gameModes.find((mode) => mode.id === slug);
}

export const isGameModeSlug = (value: unknown): value is GameModeSlug =>
  typeof value === 'string' &&
  (gameModeSlugs as readonly string[]).includes(value);
