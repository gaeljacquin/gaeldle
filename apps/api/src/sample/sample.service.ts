import { Injectable } from '@nestjs/common';
import { S3Service } from '@/lib/s3.service';
import { SAMPLE_DIR } from '@workspace/shared';
import configuration from '@/config/configuration';
import { SqsService } from '@/lib/sqs.service';

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
  ) {}

  async uploadImage(input: uploadImageProps) {
    try {
      const { image, extension } = input;

      // Remove base64 prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const timestamp = Date.now();
      const fileName = `${SAMPLE_DIR}/placeholder_${timestamp}.${extension}`;

      await this.s3Service.uploadImage(
        fileName,
        buffer,
        `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      );

      return {
        success: true,
        url: fileName,
      };
    } catch (error) {
      console.error('Sample image upload failed:', error);
      throw error;
    }
  }

  async sendMessage(input: sendMessageProps) {
    try {
      const result = await this.sqsService.sendMessage(
        configuration().sampleSqsQueueUrl,
        { message: input.message },
      );

      return {
        success: true,
        messageId: result.MessageId ?? '',
        message: input.message + ' Acknowledged!',
      };
    } catch (error) {
      console.error('Sending sample message failed:', error);
      throw error;
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
}
