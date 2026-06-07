import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type HexclaveSignInResult = {
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
  expiresAtMillis: number | null;
};

const HEXCLAVE_API_BASE_URL =
  process.env.HEXCLAVE_API_URL || 'https://api.hexclave.com';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const getNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

@Injectable()
export class HexclaveService {
  private readonly hexclaveProjectId: string;
  private readonly hexclavePublishableClientKey: string;
  private readonly hexclaveSecretServerKey: string;

  constructor(private readonly configService: ConfigService) {
    this.hexclaveProjectId =
      this.configService.get<string>('hexclaveProjectId') ?? '';
    this.hexclavePublishableClientKey =
      this.configService.get<string>('hexclavePublishableClientKey') ?? '';
    this.hexclaveSecretServerKey =
      this.configService.get<string>('hexclaveSecretServerKey') ?? '';
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<HexclaveSignInResult> {
    if (
      !this.hexclaveProjectId ||
      !this.hexclavePublishableClientKey ||
      !this.hexclaveSecretServerKey
    ) {
      throw new UnauthorizedException('Hexclave is not configured');
    }

    const response = await fetch(
      `${HEXCLAVE_API_BASE_URL}/api/v1/auth/password/sign-in`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-stack-access-type': 'server',
          'x-stack-project-id': this.hexclaveProjectId,
          'x-stack-publishable-client-key': this.hexclavePublishableClientKey,
          'x-stack-secret-server-key': this.hexclaveSecretServerKey,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    const raw = (await response.json().catch(() => null)) as unknown;
    if (!response.ok || !isRecord(raw)) {
      throw new UnauthorizedException('Invalid Hexclave credentials');
    }

    const accessToken =
      getString(raw.access_token) ?? getString(raw.accessToken);
    const refreshToken =
      getString(raw.refresh_token) ?? getString(raw.refreshToken);
    const userId = getString(raw.user_id) ?? getString(raw.userId);
    const expiresAtMillis =
      getNumber(raw.access_token_expires_at_millis) ??
      getNumber(raw.accessTokenExpiresAtMillis);

    if (!accessToken) {
      throw new UnauthorizedException('Invalid Hexclave response');
    }

    return {
      accessToken,
      refreshToken,
      userId,
      expiresAtMillis,
    };
  }
}
