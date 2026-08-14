import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type HexclaveSignInResult = {
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
  expiresAtMillis: number | null;
};

const hexclaveApiUrl =
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

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.hexclaveProjectId =
      this.configService?.get<string>('hexclaveProjectId') ?? '';
    this.hexclavePublishableClientKey =
      this.configService?.get<string>('hexclavePublishableClientKey') ?? '';
    this.hexclaveSecretServerKey =
      this.configService?.get<string>('hexclaveSecretServerKey') ?? '';
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<HexclaveSignInResult> {
    const response = await fetch(
      `${hexclaveApiUrl}/api/v1/auth/password/sign-in`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stack-project-id': this.hexclaveProjectId,
          'x-stack-publishable-client-key': this.hexclavePublishableClientKey,
          'x-stack-access-type': 'client',
        },
        body: JSON.stringify({ email, password }),
      },
    );

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.message === 'string'
          ? payload.message
          : 'Invalid credentials';
      throw new UnauthorizedException(message);
    }

    if (!isRecord(payload)) {
      throw new UnauthorizedException(
        'Invalid response structure from auth API',
      );
    }

    const accessToken = getString(payload.access_token);
    if (!accessToken) {
      throw new UnauthorizedException('Missing access token in auth response');
    }

    return {
      accessToken,
      refreshToken: getString(payload.refresh_token),
      userId: getString(payload.user_id),
      expiresAtMillis: getNumber(payload.expires_at_millis),
    };
  }
}
