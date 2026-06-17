import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@/config/configuration';

@Injectable()
export class R2Service {
  public readonly r2PublicUrl: string;

  constructor(private readonly configService: ConfigService<AppConfiguration>) {
    const r2PublicUrlRaw =
      this.configService.get('r2PublicUrl', { infer: true }) ?? '';
    this.r2PublicUrl = r2PublicUrlRaw.startsWith('http')
      ? r2PublicUrlRaw
      : `https://${r2PublicUrlRaw}`;
  }
}
