import { Controller, UseGuards, Req } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { SampleService } from '@/sample/sample.service';
import {
  type AuthenticatedRequest,
  HexclaveGuard,
} from '@/auth/hexclave.guard';

@Controller()
export class SampleRouter {
  constructor(private readonly sampleService: SampleService) {}

  @Implement(contract.sample.uploadImage)
  @UseGuards(HexclaveGuard)
  uploadImage(@Req() req: AuthenticatedRequest) {
    return implement(contract.sample.uploadImage).handler(async ({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const res = await this.sampleService.uploadImage(input, actorId);

      if (!res.success) {
        throw new Error('Unable to upload sample image...');
      }

      return res;
    });
  }

  @Implement(contract.sample.sendMessage)
  @UseGuards(HexclaveGuard)
  sendMessage(@Req() req: AuthenticatedRequest) {
    return implement(contract.sample.sendMessage).handler(async ({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const res = await this.sampleService.sendMessage(input, actorId);

      if (!res.success) {
        throw new Error('Unable to send sample message...');
      }

      return res;
    });
  }

  @Implement(contract.sample.clearQueue)
  @UseGuards(HexclaveGuard)
  clearQueue(@Req() req: AuthenticatedRequest) {
    return implement(contract.sample.clearQueue).handler(async () => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const res = await this.sampleService.clearQueue(actorId);

      if (!res.success) {
        throw new Error('Unable to clear sample queue...');
      }

      return res;
    });
  }
}
