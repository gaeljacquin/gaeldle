export interface Game {
  id: number;
  igdbId: number;
  name: string;
  imageUrl: string | null;
  aiImageUrl?: string | null;
  artworks: unknown;
  info: unknown;
  firstReleaseDate: number | null;
  keywords?: unknown;
  franchises?: unknown;
  game_engines?: unknown;
  game_modes?: unknown;
  genres?: unknown;
  involved_companies?: unknown;
  platforms?: unknown;
  player_perspectives?: unknown;
  release_dates?: unknown;
  themes?: unknown;
}

export interface GameApiResponse {
  success: boolean;
  data: Game | Game[];
  error?: string;
}

export type CoverArtMode = 'cover-art' | 'image-ai' | 'artwork';

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
