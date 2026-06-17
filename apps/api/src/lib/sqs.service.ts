import { Injectable } from '@nestjs/common';
import {
  PurgeQueueCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import configuration from '@/config/configuration';

@Injectable()
export class SqsService {
  private readonly client = new SQSClient({
    region: configuration().awsRegion,
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

  async clearQueue(queueUrl: string) {
    const command = new PurgeQueueCommand({
      QueueUrl: queueUrl,
    });

    return this.client.send(command);
  }
}
