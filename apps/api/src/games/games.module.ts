import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { GamesRouter } from '@/games/games.router';
import { GamesService } from '@/games/games.service';
import { IgdbService } from '@/lib/igdb.service';
import { S3Service } from '@/lib/s3.service';
import { AiService } from '@/lib/ai.service';
import { BulkImageJobStore } from '@/bulk-image-gen/bulk-image-job.store';
import { BulkImageGenRouter } from '@/bulk-image-gen/bulk-image-gen.router';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamesRouter, BulkImageGenRouter],
  providers: [
    GamesService,
    IgdbService,
    S3Service,
    AiService,
    BulkImageJobStore,
  ],
  exports: [GamesService, IgdbService],
})
export class GamesModule {}
