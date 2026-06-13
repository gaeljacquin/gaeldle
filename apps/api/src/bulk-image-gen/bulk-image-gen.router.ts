import {
  Controller,
  Param,
  Sse,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { Observable, merge, EMPTY } from 'rxjs';
import { map, take, filter, mergeMap } from 'rxjs/operators';
import {
  BulkImageJobStore,
  type BulkJobEvent,
} from '@/bulk-image-gen/bulk-image-job.store';
import { BulkImageGenService } from '@/bulk-image-gen/bulk-image-gen.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import { contract } from '@workspace/api-contract';

@Controller('api/bulk-image-gen')
export class BulkImageGenRouter {
  constructor(
    private readonly bulkImageService: BulkImageGenService,
    private readonly bulkImageJobStore: BulkImageJobStore,
  ) {}

  @Implement(contract.big.generateImage)
  @UseGuards(HexclaveGuard)
  generateImage() {
    return implement(contract.big.generateImage).handler(async ({ input }) => {
      const result = await this.bulkImageService.generateImage(input);

      if (!result) {
        throw new NotFoundException('Game not found');
      }

      return result;
    });
  }

  @Implement(contract.big.bulkGenerateImages)
  @UseGuards(HexclaveGuard)
  bulkGenerateImages() {
    return implement(contract.big.bulkGenerateImages).handler(
      async ({ input }) => {
        const { jobId, gamesQueued } =
          await this.bulkImageService.bulkGenerateImages(input);

        return { success: true, jobId, gamesQueued };
      },
    );
  }

  @Implement(contract.big.getBulkJobStatus)
  @UseGuards(HexclaveGuard)
  getBulkJobStatus() {
    return implement(contract.big.getBulkJobStatus).handler(
      async ({ input }) => {
        const job = await this.bulkImageService.getBulkJobStatus(input.jobId);

        return { success: true, ...job };
      },
    );
  }

  @Sse('bulk-generate-images/:jobId/stream')
  @UseGuards(HexclaveGuard)
  async stream(
    @Param('jobId') jobId: string,
  ): Promise<Observable<MessageEvent>> {
    // Check if job is already completed — emit immediately and close
    let job: Awaited<ReturnType<BulkImageGenService['getBulkJobStatus']>>;

    try {
      job = await this.bulkImageService.getBulkJobStatus(jobId);
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
