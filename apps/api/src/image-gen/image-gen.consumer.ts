import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { SqsService } from '@/lib/sqs.service';
import { ImageGenService } from '@/image-gen/image-gen.service';
import configuration from '@/config/configuration';

type SingleImageGenQueueMessage = {
  type?: string;
  jobId?: string;
  input: Parameters<ImageGenService['runSingleGeneration']>[0];
  actorId: string;
};

@Injectable()
export class ImageGenConsumer
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private isRunning = false;
  private readonly abortController = new AbortController();

  constructor(
    private readonly sqsService: SqsService,
    private readonly imageGenService: ImageGenService,
  ) {}

  onApplicationBootstrap() {
    this.isRunning = true;
    // Start poll loop asynchronously so we do not block bootstrap process
    this.poll().catch((err) => {
      console.error('[ImageGenConsumer] Fatal poll loop error:', err);
    });
  }

  onApplicationShutdown() {
    this.isRunning = false;
    this.abortController.abort();
  }

  private async poll() {
    const queueUrl = configuration().imageGenSqsQueueUrl;
    const pollDelayMs = configuration().imageGenConsumerPollDelayMs;
    console.log(
      `[ImageGenConsumer] Starting poll loop for queue: ${queueUrl} with delay: ${pollDelayMs}ms`,
    );

    while (this.isRunning) {
      try {
        if (pollDelayMs > 0) {
          await this.sleep(pollDelayMs);
        }
        if (!this.isRunning) {
          break;
        }

        const response = await this.sqsService.receiveMessage(
          queueUrl,
          1,
          20,
          this.abortController.signal,
        );

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            if (!this.isRunning) {
              break;
            }

            if (!message.Body) {
              continue;
            }

            let job: SingleImageGenQueueMessage | undefined;

            let shouldDelete = true;

            try {
              job = JSON.parse(message.Body) as SingleImageGenQueueMessage;

              if (!job) {
                throw new Error('Image generation job payload is empty');
              }

              if (job.type === 'image-gen') {
                console.log(
                  `[ImageGenConsumer] Received single image gen job for igdbId ${job.input.igdbId}`,
                );

                const shouldProcess =
                  !job.jobId ||
                  (await this.imageGenService.startSingleImageGenJob(
                    job.jobId,
                  ));

                if (shouldProcess) {
                  const result = await this.imageGenService.runSingleGeneration(
                    job.input,
                    job.actorId,
                    job.jobId,
                  );

                  if (job.jobId) {
                    await this.imageGenService.completeSingleImageGenJob(
                      job.jobId,
                      result.url,
                    );
                  }
                }
              } else {
                console.warn(
                  `[ImageGenConsumer] Received unknown job type: ${job.type}`,
                );
              }
            } catch (err) {
              console.error(
                `[ImageGenConsumer] Failed to process message:`,
                err,
              );

              if (job?.jobId) {
                const errorMessage =
                  err instanceof Error ? err.message : String(err);
                const { shouldRetry } =
                  await this.imageGenService.retryOrFailSingleImageGenJob(
                    job.jobId,
                    errorMessage,
                  );
                shouldDelete = !shouldRetry;
              } else {
                shouldDelete = false;
              }
            }

            if (shouldDelete && message.ReceiptHandle) {
              await this.sqsService.deleteMessage(
                queueUrl,
                message.ReceiptHandle,
              );
              console.log(
                `[ImageGenConsumer] Processed and deleted image generation job`,
              );
            }
          }
        }
      } catch (err) {
        if (!this.isRunning) {
          break;
        }
        console.error('[ImageGenConsumer] Polling error:', err);
        // Sleep for 5 seconds on SQS request error to avoid hammering
        try {
          await this.sleep(5000);
        } catch {
          break;
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const signal = this.abortController.signal;

      if (signal.aborted) {
        return reject(new Error('Aborted'));
      }

      const timeout = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);

      function onAbort() {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      }

      signal.addEventListener('abort', onAbort);
    });
  }
}
