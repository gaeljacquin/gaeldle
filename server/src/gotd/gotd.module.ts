import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { PrismaService } from '~/src/prisma/prisma.service';

@Module({
  controllers: [GotdController],
  providers: [GotdService, PrismaService],
})
export class GotdModule {}
