import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { GotdGateway } from './gotd.gateway';

@Module({
  controllers: [GotdController],
  providers: [GotdService, PrismaService, GotdGateway],
})
export class GotdModule {}
