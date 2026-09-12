import { Injectable } from '@nestjs/common';
import { S3Service } from '@/lib/s3.service';
import { SAMPLE_DIR } from '@workspace/shared';
import configuration from '@/config/configuration';
import { SqsService } from '@/lib/sqs.service';
import { R2Service } from '@/lib/r2.service';
import { DatabaseService } from '@/db/database.service';
import { domainEvents } from '@workspace/db';

interface uploadImageProps {
  image: string;
  extension: string;
}

interface sendMessageProps {
  message: string;
}

@Injectable()
export class SampleService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly sqsService: SqsService,
    private readonly databaseService: DatabaseService,
    private readonly r2Service: R2Service,
  ) {}

  async uploadImage(input: uploadImageProps, actorId: string) {
    const { image, extension } = input;
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const timestamp = Date.now();
    const fileName = `${SAMPLE_DIR}/placeholder_${timestamp}.${extension}`;

    try {
      await this.s3Service.uploadImage(
        fileName,
        buffer,
        `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      );

      const url = `${this.r2Service.r2PublicUrl}/${fileName}`;

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'upload_sample_image_r2',
        actorId,
        payload: { success: true, error: '', url },
      });

      return { success: true, url };
    } catch (error) {
      console.error('Sample image upload failed:', error);

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'upload_sample_image_r2',
        actorId,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          url: '',
        },
      });

      throw error;
    }
  }

  async sendMessage(input: sendMessageProps, actorId: string) {
    try {
      const res = await this.sqsService.sendMessage(
        configuration().sampleSqsQueueUrl,
        { message: input.message },
      );

      if (!res.ok) {
        throw new Error('Failed to send sample message');
      }

      const messageId = res.MessageId ?? '';
      const message = input.message + ' Acknowledged!';

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'send_sample_sqs_message',
        actorId,
        payload: { success: true, error: '', messageId, message },
      });

      return { success: true, messageId, message };
    } catch (error) {
      console.error('Sending sample message failed:', error);

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'send_sample_sqs_message',
        actorId,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          messageId: '',
          message: '',
        },
      });

      throw error;
    }
  }

  async clearQueue(actorId: string) {
    const queueUrl = configuration().sampleSqsQueueUrl;
    const queueId = queueUrl.split('/').pop() ?? queueUrl;

    try {
      const res = await this.sqsService.clearQueue(queueUrl);

      if (!res.ok) {
        throw new Error('Clearing SQS queue failed');
      }

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'clear_sample_sqs_queue',
        actorId,
        payload: { success: true, error: '', queueUrl, queueId },
      });

      return { success: true, message: 'Cleared sample SQS queue.' };
    } catch (error) {
      console.error('Clearing sample queue failed:', error);

      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'clear_sample_sqs_queue',
        actorId,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          queueUrl,
          queueId,
        },
      });

      throw error;
    }
  }
}
