import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesService } from '~/src/modes/modes.service';

@Module({
  controllers: [GotdController],
  providers: [GotdService, PrismaService, ModesService],
})
export class GotdModule {}
