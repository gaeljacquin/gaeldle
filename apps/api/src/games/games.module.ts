import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { GamesRouter } from '@/games/games.router';
import { GamesService } from '@/games/games.service';
import { IgdbService } from '@/games/igdb.service';
import { S3Service } from '@/lib/s3.service';
import { AiService } from '@/lib/ai.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamesRouter],
  providers: [GamesService, IgdbService, S3Service, AiService],
})
export class GamesModule {}
