import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'src/config/env';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function convertSummaryToImagePrompt(gameTitle: string, summary: string): Promise<string> {
  console.log('[AI-PROMPT-GEN] Starting convertSummaryToImagePrompt');
  console.log('[AI-PROMPT-GEN] Game:', gameTitle);
  console.log('[AI-PROMPT-GEN] Summary length:', summary.length, 'chars');

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  const systemPrompt = `
    You are an expert at converting game descriptions into visual image generation prompts that capture the game's distinctive identity.

    Your task: Create a prompt that generates recognizable cover art by identifying the game's ICONIC VISUAL ELEMENTS, unique setting, and distinctive aesthetic - while avoiding direct copying of existing art.

    RULES:
    - Extract SPECIFIC visual elements that make this game unique (distinct environments, signature objects, recognizable symbols)
    - Include the game's DISTINCTIVE COLOR PALETTE if identifiable from the description
    - Use concrete visual details, not just abstract mood (e.g., "neon-lit cyberpunk streets" not just "futuristic mood")
    - Incorporate recognizable themes or motifs (portals, specific weapons, iconic vehicles, distinctive architecture)
    - Balance specificity with artistic interpretation - be recognizable but not a literal copy
    - CRITICAL: Include "no text, no letters, no words, no UI elements, no typography" in every prompt
    - Keep it under 120 words
    - Use cinematic composition and professional art style descriptors

    EXAMPLES:

    Game: "Firework" - "An accidental fire at a funeral forces police to re-investigate a closed case of massacre..."
    Output: "Detective noir concept art, crime scene with burning funeral chrysanthemums and candles, evidence markers, dramatic fire and smoke illumination, detective silhouette examining clues, dark cinematic atmosphere with orange fire glow contrasting deep blue shadows, professional mystery thriller aesthetic, detailed illustration style, no text, no letters, no words, artstation quality"

    Game: "Spider Hero" - "Play as a superhero with spider powers fighting crime in a big city"
    Output: "Dynamic superhero leaping between Manhattan skyscrapers, distinctive red and blue costume design, intricate glowing web patterns stretched across buildings, aerial perspective of New York cityscape at sunset, heroic action composition, dramatic lighting with lens flare, comic book meets cinematic concept art, vibrant colors, no text, no letters, no UI, digital illustration"

    Game: "Peaceful Farm" - "Build and manage your dream farm, grow crops, raise animals, and enjoy rural life"
    Output: "Cozy farm homestead with red barn, golden wheat fields, windmill, scattered farm animals (chickens, cows), rustic wooden fences, vegetable garden with pumpkins and sunflowers, warm golden hour lighting, gentle rolling countryside, charming illustration with soft colors, pastoral game art style, inviting atmosphere, no text, no words, digital painting"

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
