import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { DrizzleService, DrizzleProvider } from '~/src/drizzle/service';

@Module({
  controllers: [GotdController],
  providers: [GotdService, DrizzleService, DrizzleProvider],
})
export class GotdModule {}
