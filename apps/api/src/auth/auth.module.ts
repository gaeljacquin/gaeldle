import { Module } from '@nestjs/common';
import { StackAuthController } from './stack-auth.controller';
import { StackAuthGuard } from './stack-auth.guard';
import { StackAuthService } from './stack-auth.service';

@Module({
  controllers: [StackAuthController],
  providers: [StackAuthService, StackAuthGuard],
  exports: [StackAuthGuard],
})
export class AuthModule {}
