import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { SqsService } from '@/lib/sqs.service';
import { ImageGenService } from '@/image-gen/image-gen.service';
import configuration from '@/config/configuration';

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

            try {
              const job = JSON.parse(message.Body);
              if (job.type === 'image-gen') {
                console.log(
                  `[ImageGenConsumer] Received single image gen job for igdbId ${job.input.igdbId}`,
                );

                // Process the job
                await this.imageGenService.runSingleGeneration(
                  job.input,
                  job.actorId,
                );
              } else {
                console.warn(
                  `[ImageGenConsumer] Received unknown job type: ${job.type}`,
                );
              }

              // Delete the message from SQS upon successful processing
              if (message.ReceiptHandle) {
                await this.sqsService.deleteMessage(
                  queueUrl,
                  message.ReceiptHandle,
                );
                console.log(
                  `[ImageGenConsumer] Successfully processed and deleted job`,
                );
              }
            } catch (err) {
              console.error(
                `[ImageGenConsumer] Failed to process message:`,
                err,
              );
              // Leave message in SQS for visibility timeout/retry
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
