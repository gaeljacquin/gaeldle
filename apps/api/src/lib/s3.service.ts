import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppConfiguration } from '@/config/configuration';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(
    @Optional()
    private readonly configService?: ConfigService<AppConfiguration>,
  ) {
    const endpoint =
      this.configService?.get('r2Endpoint', { infer: true }) ||
      'https://localhost';
    const accessKeyId =
      this.configService?.get('r2AccessKeyId', { infer: true }) || 'dummy';
    const secretAccessKey =
      this.configService?.get('r2SecretAccessKey', { infer: true }) || 'dummy';
    this.bucketName =
      this.configService?.get('r2BucketName', { infer: true }) || 'dummy';

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    return this.uploadImage(key, fileBuffer, contentType);
  }

  async uploadImage(
    key: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await this.client.send(command);

    return key;
  }
}
