import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type StackSignInResult = {
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
  expiresAtMillis: number | null;
};

const STACK_API_BASE_URL = 'https://api.stack-auth.com';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const getNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

@Injectable()
export class StackAuthService {
  private readonly stackProjectId: string;
  private readonly stackPublishableClientKey: string;
  private readonly stackSecretServerKey: string;

  constructor(private readonly configService: ConfigService) {
    this.stackProjectId =
      this.configService.get<string>('stackProjectId') ?? '';
    this.stackPublishableClientKey =
      this.configService.get<string>('stackPublishableClientKey') ?? '';
    this.stackSecretServerKey =
      this.configService.get<string>('stackSecretServerKey') ?? '';
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<StackSignInResult> {
    if (
      !this.stackProjectId ||
      !this.stackPublishableClientKey ||
      !this.stackSecretServerKey
    ) {
      throw new UnauthorizedException('Stack Auth is not configured');
    }

    const response = await fetch(
      `${STACK_API_BASE_URL}/api/v1/auth/password/sign-in`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-stack-access-type': 'server',
          'x-stack-project-id': this.stackProjectId,
          'x-stack-publishable-client-key': this.stackPublishableClientKey,
          'x-stack-secret-server-key': this.stackSecretServerKey,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    const raw = (await response.json().catch(() => null)) as unknown;
    if (!response.ok || !isRecord(raw)) {
      throw new UnauthorizedException('Invalid Stack Auth credentials');
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
      throw new UnauthorizedException('Invalid Stack Auth response');
    }

    return {
      accessToken,
      refreshToken,
      userId,
      expiresAtMillis,
    };
  }
}
