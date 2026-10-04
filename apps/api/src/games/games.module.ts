import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../db/database.module';
import { GamesRouter } from './games.router';
import { LibrariesRouter } from './libraries.router';
import { WishlistsRouter } from './wishlists.router';
import { GamesService } from './games.service';
import { IgdbService } from '../lib/igdb.service';
import { S3Service } from '../lib/s3.service';
import { AiService } from '../lib/ai.service';
import { R2Service } from '../lib/r2.service';
import { ImageGenService } from '../image-gen/image-gen.service';
import { ImageGenRouter } from '../image-gen/image-gen.router';
import { ClueRouter } from '../clue/clue.router';
import { ClueService } from '../clue/clue.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    GamesRouter,
    LibrariesRouter,
    WishlistsRouter,
    ImageGenRouter,
    ClueRouter,
  ],
  providers: [
    GamesService,
    IgdbService,
    S3Service,
    AiService,
    R2Service,
    ImageGenService,
    ClueService,
  ],
  exports: [GamesService, IgdbService],
})
export class GamesModule {}
