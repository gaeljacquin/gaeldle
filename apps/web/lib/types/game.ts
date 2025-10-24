export interface Game {
  id: number;
  igdbId: number;
  name: string;
  imageUrl: string | null;
  artworks: unknown;
  info: unknown;
  firstReleaseDate: number | null;
}

export interface GameApiResponse {
  success: boolean;
  data: Game | Game[];
  error?: string;
}

export type CoverArtMode = 'cover-art' | 'cover-art-2';

export interface GameState {
  targetGame: Game | null;
  selectedGameId: number | null;
  wrongGuesses: number[];
  attemptsLeft: number;
  isGameOver: boolean;
  isCorrect: boolean;
  currentPixelSize: number;
}
