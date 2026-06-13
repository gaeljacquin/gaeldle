export const IMAGE_PROMPT_SUFFIX =
  "Funko Pop chibi art style, big head small body, large expressive eyes, scene depicts the game's iconic setting and atmosphere, vibrant colorful illustration, highly detailed digital art, no packaging, no box, no shelf, no text, no letters, no words, no titles, no logos, no watermarks, no labels, no UI elements, no written characters of any kind.";

export const DEFAULT_IMAGE_GEN_ART_STYLE = 'funko-pop-chibi';

export const DEFAULT_IMAGE_GEN_NUM = 5;

export const IMAGE_GEN_MIN = 1;

export const IMAGE_GEN_MAX = 50;

export const FILE_SIZE_LIMIT = '10mb';

export const SAMPLE_DIR = 'sample-dir';

export const IMAGE_GEN_DIR = 'res';

export const REPLACE_GAME_MAX_ROWS = 20;

export const ADD_GAME_MAX_ROWS = 20;

export const PLACEHOLDER_IMAGE = 'placeholder.jpg';

export const PLACEHOLDER_IMAGE_R2 = (r2PublicUrl: string) =>
  `${r2PublicUrl}/${PLACEHOLDER_IMAGE}`;

export const DISCOVER_GAMES_MAX = 50;

export const DISCOVER_GAMES_DEFAULT = 10;

export const GAME_SEARCH_MIN_CHARS = 3;

export const TIMELINE_MAX_ATTEMPTS = 3;

export const TIMELINE_GAMES_COUNT = 10;

export const TIMELINE_2_MAX_ATTEMPTS = 7;

export const SPECIFICATIONS_MAX_ATTEMPTS = 10;

export const HOLD_DURATION = 3000;

export const COVER_ART_MAX_ATTEMPTS = 5;

export const MIN_PREVIEW_PROMPT_ROWS = 4;

export const GAME_MODE_SKELETON_COUNT = 6;
