import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@/config/configuration';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

@Injectable()
export class AiService {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly bedrockClient: BedrockRuntimeClient;

  constructor(private readonly configService: ConfigService<AppConfiguration>) {
    this.accountId =
      this.configService.get('cfAccountId', { infer: true }) ?? '';
    this.apiToken = this.configService.get('cfApiToken', { infer: true }) ?? '';

    const awsAccessKeyId =
      this.configService.get('awsAccessKeyId', { infer: true }) ?? '';
    const awsSecretAccessKey =
      this.configService.get('awsSecretAccessKey', { infer: true }) ?? '';
    const awsRegion =
      this.configService.get('awsRegion', { infer: true }) ?? '';
    const clientConfig: any = {
      region: awsRegion,
    };

    if (awsAccessKeyId && awsSecretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      };
    }

    this.bedrockClient = new BedrockRuntimeClient(clientConfig);
  }

  async generateImage(prompt: string, provider: string): Promise<Buffer> {
    switch (provider) {
      case 'cloudflare':
        return this.generateImageCloudflare(prompt);
      default:
        throw new Error(`Unsupported model/provider: ${provider}`);
    }
  }

  private async generateImageCloudflare(prompt: string): Promise<Buffer> {
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

  async generateText(
    model: string,
    messages: Array<{ role: string; content: string }>,
    responseFormat?:
      { type: 'json_object' } | { type: 'json_schema'; json_schema: any },
  ): Promise<string> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        ...(responseFormat ? { response_format: responseFormat } : {}),
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

    const json = await response.json();

    if (!json.success) {
      console.error('[AiService] Cloudflare Workers AI success=false:', json);
      throw new Error(
        `Cloudflare Workers AI invocation failed: ${JSON.stringify(
          json.errors,
        )}`,
      );
    }

    return json.result.response;
  }

  async generateTextBedrock(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const system = systemMessages.map((m) => ({ text: m.content }));
    const converseMessages = conversationMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: [{ text: m.content }],
    }));

    try {
      const command = new ConverseCommand({
        modelId: model,
        messages: converseMessages,
        system: system.length > 0 ? system : undefined,
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.7,
        },
      });

      const response = await this.bedrockClient.send(command);
      const text = response.output?.message?.content?.[0]?.text;

      if (!text) {
        throw new Error('Bedrock returned an empty response output');
      }

      return text;
    } catch (error) {
      console.error('[AiService] Bedrock AI error:', error);
      throw error;
    }
  }
}
