import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { SampleRouter } from '@/sample/sample.router';
import { SampleService } from '@/sample/sample.service';
import { S3Service } from '@/lib/s3.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SampleRouter],
  providers: [SampleService, S3Service],
  exports: [SampleService],
})
export class SampleModule {}
