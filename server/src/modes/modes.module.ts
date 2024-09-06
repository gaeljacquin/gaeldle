import { Module } from '@nestjs/common';
import { ModesController } from './modes.controller';
import { ModesService } from './modes.service';
import { DrizzleService, DrizzleProvider } from '~/src/drizzle/service';

@Module({
  controllers: [ModesController],
  providers: [ModesService, DrizzleService, DrizzleProvider],
})
export class ModesModule {}
