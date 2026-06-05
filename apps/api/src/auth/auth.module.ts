import { Module } from '@nestjs/common';
import { HexclaveAuthController } from '@/auth/hexclave.controller';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import { HexclaveService } from '@/auth/hexclave.service';

@Module({
  controllers: [HexclaveAuthController],
  providers: [HexclaveService, HexclaveGuard],
  exports: [HexclaveGuard],
})
export class AuthModule {}
