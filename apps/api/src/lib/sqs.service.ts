import { Injectable } from '@nestjs/common';
import {
  PurgeQueueCommand,
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import configuration from '@/config/configuration';

@Injectable()
export class SqsService {
  private readonly client = new SQSClient({
    region: configuration().awsRegion,
    credentials:
      configuration().awsAccessKeyId && configuration().awsSecretAccessKey
        ? {
            accessKeyId: configuration().awsAccessKeyId,
            secretAccessKey: configuration().awsSecretAccessKey,
          }
        : undefined,
  });

  async sendMessage(queueUrl: string, body: Record<string, unknown>) {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
    });

    const res = await this.client.send(command);

    return {
      ok: res.$metadata.httpStatusCode === 200,
      ...res,
    };
  }

  async receiveMessage(
    queueUrl: string,
    maxMessages = 1,
    waitTimeSeconds = 20,
    abortSignal?: AbortSignal,
  ) {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
    });

    return this.client.send(command, { abortSignal });
  }

  async deleteMessage(queueUrl: string, receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    return this.client.send(command);
  }

  async clearQueue(queueUrl: string) {
    const command = new PurgeQueueCommand({
      QueueUrl: queueUrl,
    });

    const res = await this.client.send(command);

    return {
      ok: res.$metadata.httpStatusCode === 200,
      ...res,
    };
  }
}
