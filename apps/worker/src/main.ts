import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../api/src/app.module';
import { ImageGenService } from '../../api/src/image-gen/image-gen.service';
import { QueueClient, imageGenerationMessageSchema } from '@workspace/queue';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ImageGenService);
  const queueUrl = process.env.IMAGE_GEN_SQS_QUEUE_URL;

  if (!queueUrl) {
    throw new Error('IMAGE_GEN_SQS_QUEUE_URL is required');
  }

  const queue = new QueueClient({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  const abortController = new AbortController();
  const shutdown = async () => {
    abortController.abort();
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());

  while (!abortController.signal.aborted) {
    await service.dispatchPendingJobs();
    const received = await queue.receive(queueUrl, abortController.signal);
    for (const message of received.Messages ?? []) {
      if (!message.Body || !message.ReceiptHandle) continue;
      let parsed: ReturnType<typeof imageGenerationMessageSchema.safeParse>;
      try {
        parsed = imageGenerationMessageSchema.safeParse(
          JSON.parse(message.Body),
        );
      } catch {
        console.error('Discarding malformed queue message');
        await queue.acknowledge(queueUrl, message.ReceiptHandle);
        continue;
      }
      if (!parsed.success) {
        console.error(
          'Discarding invalid queue message',
          parsed.error.flatten(),
        );
        await queue.acknowledge(queueUrl, message.ReceiptHandle);
        continue;
      }

      let acknowledge = true;
      try {
        const started = await service.startSingleImageGenJob(parsed.data.jobId);
        if (started) {
          const { input, actorId } = await service.getWorkerInput(
            parsed.data.jobId,
          );
          const result = await service.runSingleGeneration(
            input,
            actorId,
            parsed.data.jobId,
          );
          await service.completeSingleImageGenJob(
            parsed.data.jobId,
            result.url,
          );
        }
      } catch (error) {
        const result = await service.retryOrFailSingleImageGenJob(
          parsed.data.jobId,
          error instanceof Error ? error.message : String(error),
        );
        acknowledge = !result.shouldRetry;
        console.error('Image generation job failed', {
          jobId: parsed.data.jobId,
          error,
        });
      }

      if (acknowledge) await queue.acknowledge(queueUrl, message.ReceiptHandle);
    }
  }
}

void bootstrap();
