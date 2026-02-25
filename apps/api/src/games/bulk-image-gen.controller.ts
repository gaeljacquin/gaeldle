import {
  Controller,
  Param,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, merge, EMPTY } from 'rxjs';
import { map, take, filter, mergeMap } from 'rxjs/operators';
import type { JWTPayload } from 'jose';
import { GamesService } from '@/games/games.service';
import {
  BulkImageJobStore,
  type BulkJobEvent,
} from '@/games/bulk-image-job.store';

type JoseModule = typeof import('jose');
let josePromise: Promise<JoseModule> | null = null;
const getJose = () => (josePromise ??= import('jose'));

@Controller('api/games')
export class BulkImageGenController {
  private readonly projectId: string;
  private readonly jwksUrl: URL;
  private jwks: ReturnType<JoseModule['createRemoteJWKSet']> | null = null;

  constructor(
    private readonly gamesService: GamesService,
    private readonly bulkImageJobStore: BulkImageJobStore,
    private readonly configService: ConfigService,
  ) {
    this.projectId = this.configService.get<string>('stackProjectId') ?? '';
    this.jwksUrl = new URL(
      `https://api.stack-auth.com/api/v1/projects/${this.projectId}/.well-known/jwks.json`,
    );
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    if (!this.projectId) {
      throw new UnauthorizedException('Stack Auth is not configured');
    }
    if (!this.jwks) {
      const { createRemoteJWKSet } = await getJose();
      this.jwks = createRemoteJWKSet(this.jwksUrl);
    }
    const { jwtVerify } = await getJose();
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        audience: this.projectId,
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid Stack access token');
    }
  }

  @Sse('bulk-generate-images/:jobId/stream')
  async stream(
    @Param('jobId') jobId: string,
    @Query('token') token: string,
  ): Promise<Observable<MessageEvent>> {
    if (!token) {
      throw new UnauthorizedException('Missing token query parameter');
    }

    await this.verifyToken(token);

    // Check if job is already completed — emit immediately and close
    let job: Awaited<ReturnType<GamesService['getBulkJobStatus']>>;
    try {
      job = await this.gamesService.getBulkJobStatus(jobId);
    } catch {
      throw new UnauthorizedException(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      const completedPayload: BulkJobEvent = {
        type: 'completed',
        data: {
          succeeded: job.succeeded,
          failed: job.failed,
          failures: job.failures,
        },
      };
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next(
          new MessageEvent('message', {
            data: JSON.stringify(completedPayload),
          }),
        );
        subscriber.complete();
      });
    }

    // Subscribe to live events
    const emitter = this.bulkImageJobStore.getOrCreate(jobId);

    const events$ = new Observable<BulkJobEvent>((subscriber) => {
      const listener = (event: BulkJobEvent) => subscriber.next(event);
      emitter.on('event', listener);
      return () => emitter.off('event', listener);
    });

    const toMessageEvent = events$.pipe(
      map(
        (event) => new MessageEvent('message', { data: JSON.stringify(event) }),
      ),
    );

    // Complete the observable when we get a 'completed' or 'error' event
    const termination$ = events$.pipe(
      filter((event) => event.type === 'completed' || event.type === 'error'),
      take(1),
      mergeMap(() => EMPTY),
    );

    return merge(toMessageEvent, termination$);
  }
}
