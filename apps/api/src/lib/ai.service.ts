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
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI failed: ${response.status} ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
