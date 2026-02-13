import { Module } from '@nestjs/common';
import { StackAuthController } from '@/auth/stack-auth.controller';
import { StackAuthGuard } from '@/auth/stack-auth.guard';
import { StackAuthService } from '@/auth/stack-auth.service';

@Module({
  controllers: [StackAuthController],
  providers: [StackAuthService, StackAuthGuard],
  exports: [StackAuthGuard],
})
export class AuthModule {}
