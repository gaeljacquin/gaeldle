import { Module } from '@nestjs/common';
import { ModesController } from './modes.controller';
import { ModesService } from './modes.service';
import { PrismaService } from '~/src/prisma/prisma.service';

@Module({
  controllers: [ModesController],
  providers: [ModesService, PrismaService],
})
export class ModesModule {}
