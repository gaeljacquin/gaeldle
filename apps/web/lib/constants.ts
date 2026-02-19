export const PLACEHOLDER_IMAGE = '/placeholder.jpg'

export const PLACEHOLDER_IMAGE_R2 = `${process.env.r2PublicUrl}/placeholder.jpg`

export const TEXT_GEN_MODELS = [
  { label: 'Gemini 3 Pro Preview (Google)', value: 'google/gemini-3-pro-preview' },
  { label: 'GPT-5 Nano (OpenAI)', value: 'openai/gpt-5-nano' },
] as const;

export const IMAGE_STYLES = [
  { label: 'Funko Pop', value: 'Funko Pop' },
] as const;
