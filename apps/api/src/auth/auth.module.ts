import { Module } from '@nestjs/common';
import { HexclaveAuthController } from './hexclave.controller';
import { HexclaveGuard } from './hexclave.guard';
import { HexclaveService } from './hexclave.service';

@Module({
  controllers: [HexclaveAuthController],
  providers: [HexclaveService, HexclaveGuard],
  exports: [HexclaveGuard],
})
export class AuthModule {}
