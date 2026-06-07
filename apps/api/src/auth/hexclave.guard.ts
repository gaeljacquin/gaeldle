import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWTPayload } from 'jose';
import type { Request } from 'express';

type JoseModule = typeof import('jose');
let josePromise: Promise<JoseModule> | null = null;
const getJose = () => (josePromise ??= import('jose'));

type AuthenticatedRequest = Request & { hexclave?: JWTPayload };

@Injectable()
export class HexclaveGuard implements CanActivate {
  private readonly projectId: string;
  private readonly jwksUrl: URL;
  private jwks: ReturnType<JoseModule['createRemoteJWKSet']> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>('hexclaveProjectId') ?? '';
    const apiBaseUrl =
      process.env.HEXCLAVE_API_URL || 'https://api.hexclave.com';
    this.jwksUrl = new URL(
      `${apiBaseUrl}/api/v1/projects/${this.projectId}/.well-known/jwks.json`,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.projectId) {
      throw new UnauthorizedException('Hexclave is not configured');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing Hexclave access token');
    }

    try {
      if (!this.jwks) {
        const { createRemoteJWKSet } = await getJose();
        this.jwks = createRemoteJWKSet(this.jwksUrl);
      }

      const { jwtVerify } = await getJose();
      const { payload } = await jwtVerify(token, this.jwks, {
        audience: this.projectId,
      });
      request.hexclave = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Hexclave access token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    const hexclaveTokenHeader = request.headers['x-stack-access-token'];
    if (typeof hexclaveTokenHeader === 'string') {
      return hexclaveTokenHeader;
    }

    return null;
  }
}
