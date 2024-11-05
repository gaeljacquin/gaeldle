import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/src/app.controller';
import { AppService } from '@/src/app.service';
import { TimelineGateway } from '@/src/timeline/timeline.gateway';
import { CoverGateway } from '@/src/cover/cover.gateway';
import { HiloGateway } from '@/src/hilo/hilo.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TimelineGateway, CoverGateway, HiloGateway],
})
export class AppModule {}
