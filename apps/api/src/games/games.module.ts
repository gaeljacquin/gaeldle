import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { GamesRouter } from '@/games/games.router';
import { GamesService } from '@/games/games.service';
import { IgdbService } from '@/lib/igdb.service';
import { S3Service } from '@/lib/s3.service';
import { AiService } from '@/lib/ai.service';
import { R2Service } from '@/lib/r2.service';
import { ImageGenStore } from '@/image-gen/image-gen.store';
import { ImageGenService } from '@/image-gen/image-gen.service';
import { ImageGenRouter } from '@/image-gen/image-gen.router';
import { SqsService } from '@/lib/sqs.service';
import { ImageGenConsumer } from '@/image-gen/image-gen.consumer';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamesRouter, ImageGenRouter],
  providers: [
    GamesService,
    IgdbService,
    S3Service,
    AiService,
    R2Service,
    ImageGenService,
    ImageGenStore,
    SqsService,
    ImageGenConsumer,
  ],
  exports: [GamesService, IgdbService],
})
export class GamesModule {}
