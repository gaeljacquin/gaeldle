import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { GotdGateway } from '~/src/gotd/gotd.gateway';
import { AblyService } from '~/src/ably/ably.service';

@Module({
  controllers: [GotdController],
  providers: [GotdService, PrismaService, GotdGateway, AblyService],
})
export class GotdModule {}
