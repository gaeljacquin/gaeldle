import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppConfiguration } from '@/config/configuration';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService<AppConfiguration>) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get('r2Endpoint', { infer: true }),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get('r2AccessKeyId', { infer: true })!,
        secretAccessKey: this.configService.get('r2SecretAccessKey', {
          infer: true,
        })!,
      },
    });
    this.bucketName = this.configService.get('r2BucketName', {
      infer: true,
    })!;
  }

  async uploadImage(
    key: string,
    body: Buffer,
    contentType: string = 'image/jpeg',
  ) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.client.send(command);
    return key;
  }
}
