import {
  Controller,
  Param,
  Sse,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { Observable, merge, EMPTY } from 'rxjs';
import { map, take, filter, mergeMap } from 'rxjs/operators';
import { ImageGenStore, type ImageGenEvent } from '@/image-gen/image-gen.store';
import { ImageGenService } from '@/image-gen/image-gen.service';
import {
  type AuthenticatedRequest,
  HexclaveGuard,
} from '@/auth/hexclave.guard';
import { contract } from '@workspace/api-contract';

@Controller()
export class ImageGenRouter {
  constructor(
    private readonly imageGenService: ImageGenService,
    private readonly imageGenStore: ImageGenStore,
  ) {}

  @Implement(contract.imageGen.generateImage)
  @UseGuards(HexclaveGuard)
  generateImage(@Req() req: AuthenticatedRequest) {
    return implement(contract.imageGen.generateImage).handler(
      async ({ input }) => {
        const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
        const result = await this.imageGenService.generateImage(input, actorId);

        if (!result) {
          throw new NotFoundException('Game not found');
        }

        return result;
      },
    );
  }

  @Implement(contract.imageGen.generateImages)
  @UseGuards(HexclaveGuard)
  generateImages(@Req() req: AuthenticatedRequest) {
    return implement(contract.imageGen.generateImages).handler(
      async ({ input }) => {
        const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
        const { imageGenId, gamesQueued } =
          await this.imageGenService.generateImages(input, actorId);

        return { success: true, imageGenId, gamesQueued };
      },
    );
  }

  @Implement(contract.imageGen.getImageGenStatus)
  @UseGuards(HexclaveGuard)
  getImageGenStatus() {
    return implement(contract.imageGen.getImageGenStatus).handler(
      async ({ input }) => {
        const result = await this.imageGenService.getImageGenStatus(
          input.imageGenId,
        );

        return { success: true, ...result };
      },
    );
  }

  @Sse('api/image-gen/generate-images/:imageGenId/stream')
  @UseGuards(HexclaveGuard)
  async stream(
    @Param('imageGenId') imageGenId: string,
  ): Promise<Observable<MessageEvent>> {
    let job: Awaited<ReturnType<ImageGenService['getImageGenStatus']>>;

    try {
      job = await this.imageGenService.getImageGenStatus(imageGenId);
    } catch {
      throw new UnauthorizedException(
        `Image generation ${imageGenId} not found`,
      );
    }

    if (job.status === 'completed' || job.status === 'failed') {
      const completedPayload: ImageGenEvent = {
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
    const emitter = this.imageGenStore.getOrCreate(imageGenId);

    const events$ = new Observable<ImageGenEvent>((subscriber) => {
      const listener = (event: ImageGenEvent) => subscriber.next(event);
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
