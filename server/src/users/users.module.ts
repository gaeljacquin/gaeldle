import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleService, DrizzleProvider } from '~/src/drizzle/service';

@Module({
  providers: [UsersService, DrizzleService, DrizzleProvider],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
