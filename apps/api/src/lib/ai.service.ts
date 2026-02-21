import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@/config/configuration';

@Injectable()
export class AiService {
  private readonly accountId: string;
  private readonly apiToken: string;

  constructor(private readonly configService: ConfigService<AppConfiguration>) {
    this.accountId =
      this.configService.get('cfAccountId', { infer: true }) ?? '';
    this.apiToken = this.configService.get('cfApiToken', { infer: true }) ?? '';
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
      body: JSON.stringify({
        prompt,
        negative_prompt:
          'text, letters, words, title, logo, watermark, label, caption, typography, font, inscription, written characters, game title, brand name, signature, UI, HUD, subtitles',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[AiService] Cloudflare AI error: ${response.status}`,
        errorText,
      );
      throw new Error(`Cloudflare AI failed: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('image')) {
      const body = await response.text();
      console.error(
        `[AiService] Unexpected content-type: ${contentType}`,
        body,
      );
      throw new Error(`Unexpected response type: ${contentType} — ${body}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
