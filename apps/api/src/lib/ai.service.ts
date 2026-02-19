import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@/config/configuration';

const SYSTEM_PROMPT =
  'You are an expert at writing concise, vivid prompts for AI image generators specializing in video game cover art. ' +
  'Given game information in JSON format, write a single concise prompt (2-4 sentences) for generating cover art in the specified visual style. ' +
  'Use the summary and/or storyline to capture the essence of the game. ' +
  'Focus on key visual elements: characters, setting, mood, and the specified style. ' +
  'Return ONLY the prompt text—no explanations, labels, or extra text.';

@Injectable()
export class AiService {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly openAiApiKey: string;
  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService<AppConfiguration>) {
    this.accountId =
      this.configService.get('cfAccountId', { infer: true }) ?? '';
    this.apiToken = this.configService.get('cfApiToken', { infer: true }) ?? '';
    this.openAiApiKey = process.env.OPENAI_API_KEY ?? '';
    this.geminiApiKey = process.env.GEMINI_API_KEY ?? '';
  }

  async generateImage(prompt: string): Promise<Buffer> {
    const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI failed: ${response.status} ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async generatePrompt(data: {
    gameName: string;
    summary: string | null;
    storyline: string | null;
    style: string;
    model: string;
  }): Promise<string> {
    const [provider, modelId] = data.model.includes('/')
      ? (data.model.split('/', 2) as [string, string])
      : (['openai', data.model] as [string, string]);

    const gameData: Record<string, string | null> = {
      'game title': data.gameName,
      summary: data.summary,
      storyline: data.storyline,
      style: data.style,
    };
    const userMessage = JSON.stringify(gameData, null, 2);

    if (provider === 'google') {
      return this.generatePromptGemini(modelId, userMessage);
    }
    return this.generatePromptOpenAi(modelId, userMessage);
  }

  private async generatePromptOpenAi(modelId: string, userMessage: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AiService] OpenAI error ${response.status}:`, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    return json.choices[0].message.content.trim();
  }

  private async generatePromptGemini(modelId: string, userMessage: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AiService] Gemini error ${response.status}:`, errorText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    return json.candidates[0].content.parts[0].text.trim();
  }
}
