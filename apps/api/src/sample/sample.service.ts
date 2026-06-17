import { Injectable } from '@nestjs/common';
import { S3Service } from '@/lib/s3.service';
import { SAMPLE_DIR } from '@workspace/shared';
import configuration from '@/config/configuration';
import { SqsService } from '@/lib/sqs.service';
import { DatabaseService } from '@/db/database.service';
import { domainEvents } from '@workspace/api-contract';

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
  ) {}

  async uploadImage(input: uploadImageProps, actorId: string) {
    let success = false;
    let errorMessage = '';

    try {
      const { image, extension } = input;

      // Remove base64 prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const timestamp = Date.now();
      const fileName = `${SAMPLE_DIR}/placeholder_${timestamp}.${extension}`;

      const res = await this.s3Service.uploadImage(
        fileName,
        buffer,
        `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      );

      if (!res.ok) {
        throw new Error('Upload to R2 failed');
      }

      success = true;

      return {
        success,
        url: fileName,
      };
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);

      console.error('Sample image upload failed:', error);
      throw error;
    } finally {
      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'upload_sample_image_r2',
        actorId,
        payload: {
          success,
          error: errorMessage,
        },
      });
    }
  }

  async sendMessage(input: sendMessageProps, actorId: string) {
    let success = false;
    let errorMessage = '';
    let messageId = '';
    let message = '';

    try {
      const res = await this.sqsService.sendMessage(
        configuration().sampleSqsQueueUrl,
        { message: input.message },
      );

      if (!res.ok) {
        throw new Error('Failed to send sample message');
      }

      success = true;
      messageId = res.MessageId ?? '';
      message = input.message + ' Acknowledged!';

      return {
        success,
        messageId,
        message,
      };
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);

      console.error('Sending sample message failed:', error);
      throw error;
    } finally {
      await this.databaseService.db.insert(domainEvents).values({
        eventType: 'send_sample_sqs_message',
        actorId,
        payload: {
          messageId,
          message,
          success,
          error: errorMessage,
        },
      });
    }
  }

  async clearQueue() {
    try {
      await this.sqsService.clearQueue(configuration().sampleSqsQueueUrl);

      return {
        success: true,
        message: 'Cleared sample queue.',
      };
    } catch (error) {
      console.error('Clearing sample queue failed:', error);
      throw error;
    }
  }

  // private throwDummyError() {
  //   throw new Error('failed!');
  // }
}
