type AiProviderDefinition = {
  id: string;
  label: string;
  imageModel?: string;
  clueModel?: string;
};

export const AI_PROVIDERS = {
  default: 'cloudflare',
  options: [
    {
      id: 'cloudflare',
      label: 'Cloudflare Workers AI',
      imageModel: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      clueModel: '@cf/meta/llama-3.1-8b-instruct',
    },
    {
      id: 'nova-2-lite-v1',
      label: 'Nova 2 Lite',
      imageModel: undefined,
      clueModel: 'us.amazon.nova-2-lite-v1:0',
    },
  ],
} as const satisfies {
  default: string;
  options: readonly AiProviderDefinition[];
};

export type AiProvider = (typeof AI_PROVIDERS.options)[number]['id'];
type AiProviderConfig = (typeof AI_PROVIDERS.options)[number];
type ImageAiProviderConfig = Extract<AiProviderConfig, { imageModel: string }>;

export type ImageAiProvider = ImageAiProviderConfig['id'];

export const IMAGE_AI_PROVIDERS = AI_PROVIDERS.options.filter(
  (provider): provider is ImageAiProviderConfig =>
    typeof provider.imageModel === 'string',
);

export function getAiProvider(provider: string) {
  return AI_PROVIDERS.options.find((candidate) => candidate.id === provider);
}

export function isAiProvider(provider: string): provider is AiProvider {
  return getAiProvider(provider) !== undefined;
}

export function isImageAiProvider(
  provider: string,
): provider is ImageAiProvider {
  return IMAGE_AI_PROVIDERS.some((candidate) => candidate.id === provider);
}

export const FILE_SIZE_LIMIT = '10mb';

export const SAMPLE_DIR = 'sample-dir';

export const IMAGE_GEN_DIR = 'res';

export const ADD_GAME_MAX_ROWS = 20;

export const PLACEHOLDER_IMAGE = 'placeholder.jpg';

export const DISCOVER_GAMES_MAX = 50;

export const DISCOVER_GAMES_DEFAULT = 10;

export const TIMELINE_GAMES_COUNT = 10;

export const HOLD_DURATION = 3000;

export const GAME_MODE_SKELETON_COUNT = 6;

export const VIEWPORT_DIMENSIONS_FALLBACK = '0:0:16';

export const PLACEHOLDER_IGDB_IDS = [1942, 348330].join(',');
