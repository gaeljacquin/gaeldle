export const IMAGE_PROMPT_SUFFIX =
  'Funko Pop chibi art style, big head small body, large expressive eyes, scene depicts the game\'s iconic setting and atmosphere, vibrant colorful illustration, highly detailed digital art, no packaging, no box, no shelf, no text, no letters, no words, no titles, no logos, no watermarks, no labels, no UI elements, no written characters of any kind.';

export const DEFAULT_IMAGE_GEN_STYLE = 'funko-pop-chibi';

export const DEFAULT_IMAGE_GEN_NUM = 5;

export const IMAGE_GEN_MIN = 1;

export const IMAGE_GEN_MAX = 50;

export const IMAGE_STYLES: {
  value: string;
  label: string;
  descriptor: string;
}[] = [
  {
    value: 'funko-pop-chibi',
    label: 'Funko Pop Chibi Style',
    descriptor: 'Funko Pop chibi style illustration',
  },
  {
    value: 'simpsons',
    label: 'Simpsons Style',
    descriptor: 'Simpsons style illustration',
  },
  {
    value: 'rubber-hose-animation',
    label: 'Rubber Hose Animation Style',
    descriptor: 'Rubber hose animation style illustration',
  },
  {
    value: 'muppet',
    label: 'Muppet Style',
    descriptor: 'Muppet style illustration',
  },
  { value: 'lego', label: 'Lego Style', descriptor: 'Lego style illustration' },
  {
    value: 'claymation',
    label: 'Claymation Style',
    descriptor: 'Claymation style illustration',
  },
  {
    value: 'vector-art',
    label: 'Vector Art Style',
    descriptor: 'Vector art style illustration',
  },
  {
    value: 'digital-cel-shaded',
    label: 'Digital Cel-shaded Portrait Illustration Style',
    descriptor: 'Digital cel-shaded portrait illustration style',
  },
  {
    value: 'western-animation-concept-art',
    label: 'Western Animation Concept Art Style',
    descriptor: 'Western animation concept art style illustration',
  },
  {
    value: 'graphic-novel-illustration',
    label: 'Graphic Novel Illustration Style',
    descriptor: 'Graphic novel illustration style',
  },
];

export const FILE_SIZE_LIMIT = '10mb';

export const TEST_DIR = 'test-dir';

export const IMAGE_GEN_DIR = 'res';

export const REPLACE_GAME_MAX_ROWS = 20;

export const ADD_GAME_MAX_ROWS = 20;

export const PLACEHOLDER_IMAGE = 'placeholder.jpg';

export const PLACEHOLDER_IMAGE_R2 = (r2PublicUrl: string) => `${r2PublicUrl}/${PLACEHOLDER_IMAGE}`;

export const DISCOVER_GAMES_MAX = 50;

export const DISCOVER_GAMES_DEFAULT = 10;
