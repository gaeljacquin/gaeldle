import { Injectable } from '@nestjs/common';
import { S3Service } from '@/lib/s3.service';
import { SAMPLE_DIR } from '@workspace/constants';

@Injectable()
export class SampleService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadImage({
    input,
  }: {
    input: { image: string; extension: string };
  }) {
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

  async sendMessage({ input }: { input: { message: string } }) {
    try {
      const { message } = input;

      const delay = (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      };

      await delay(2000);

      return {
        success: true,
        message: message + ' Acknowledged!',
      };
    } catch (error) {
      console.error('Sending sample message failed:', error);
      throw error;
    }
  }
}
