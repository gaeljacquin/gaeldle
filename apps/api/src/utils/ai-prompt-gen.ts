import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'src/config/env';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function convertSummaryToImagePrompt(gameTitle: string, summary: string): Promise<string> {
  console.log('[AI-PROMPT-GEN] Starting convertSummaryToImagePrompt');
  console.log('[AI-PROMPT-GEN] Game:', gameTitle);
  console.log('[AI-PROMPT-GEN] Summary length:', summary.length, 'chars');

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  const systemPrompt = `
    You are an expert at converting game descriptions into visual, atmospheric image generation prompts.

    Your task: Extract the MOOD, ATMOSPHERE, and VISUAL THEMES from a game summary and convert them into an abstract, artistic image prompt suitable for cover art.

    RULES:
    - DO NOT use literal plot points or character names
    - Focus on: mood, atmosphere, colors, lighting, visual metaphors
    - Use abstract visual elements (smoke, shadows, light, textures)
    - Include art style descriptors (concept art, digital painting, illustration)
    - ALWAYS emphasize: "no text, no letters, no words, no typography"
    - Keep it under 100 words
    - Make it atmospheric and evocative, not literal

    EXAMPLES:

    Game: "Firework" - "An accidental fire at a funeral forces police to re-investigate a closed case of massacre..."
    Output: "Dark atmospheric concept art, mysterious investigation aesthetic, funeral flowers shrouded in smoke and shadow, dramatic orange and red fire glow, noir detective mood, cinematic lighting, moody color palette with deep blues and grays, professional game cover illustration, no text whatsoever, no letters, digital art, artstation style"

    Game: "Spider Hero" - "Play as a superhero with spider powers fighting crime in a big city"
    Output: "Urban cityscape at dusk, dramatic shadows between skyscrapers, abstract web patterns, heroic silhouette composition, dynamic action mood, red and blue color accents, cinematic lighting from below, comic book art style meets concept art, no text, no letters, digital illustration, high contrast"

    Game: "Peaceful Farm" - "Build and manage your dream farm, grow crops, raise animals, and enjoy rural life"
    Output: "Serene pastoral landscape, golden hour lighting, soft rolling hills, warm earth tones with green accents, peaceful countryside atmosphere, cozy illustration style, gentle composition, watercolor concept art aesthetic, no text, no words, digital painting, calming mood"

    Now convert this game:
  `;

  const prompt = `
    ${systemPrompt}

    Game: "${gameTitle}" - "${summary}"
    Output:
  `;

  try {
    console.log('[AI-PROMPT-GEN] Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedPrompt = response.text().trim();

    console.log('[AI-PROMPT-GEN] Generated prompt:', generatedPrompt);
    console.log('[AI-PROMPT-GEN] Completed successfully');

    return generatedPrompt;
  } catch (error) {
    console.error('[AI-PROMPT-GEN] Error calling Gemini API:', error);
    console.error('[AI-PROMPT-GEN] Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
