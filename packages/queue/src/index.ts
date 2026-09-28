import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { z } from 'zod';

export const imageGenerationMessageSchema = z.object({
  version: z.literal(1),
  type: z.literal('image.generate'),
  jobId: z.string().uuid(),
});

export type ImageGenerationMessage = z.infer<
  typeof imageGenerationMessageSchema
>;

export type QueueConfig = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export class QueueClient {
  private readonly client: SQSClient;

  constructor(config: QueueConfig) {
    this.client = new SQSClient({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  publishImageGeneration(queueUrl: string, jobId: string) {
    return this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          version: 1,
          type: 'image.generate',
          jobId,
        }),
      }),
    );
  }

  receive(queueUrl: string, abortSignal?: AbortSignal) {
    return this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      }),
      { abortSignal },
    );
  }

  acknowledge(queueUrl: string, receiptHandle: string) {
    return this.client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
