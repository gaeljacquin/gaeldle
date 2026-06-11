import { Controller, UseGuards } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { SampleService } from '@/sample/sample.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';

@Controller()
export class SampleRouter {
  constructor(private readonly sampleService: SampleService) {}

  @Implement(contract.sample.uploadImage)
  @UseGuards(HexclaveGuard)
  uploadImage() {
    return implement(contract.sample.uploadImage).handler(async (input) => {
      const uploadImageRes = await this.sampleService.uploadImage(input);

      if (!uploadImageRes.success) {
        throw new Error('Unable to upload sample image...');
      }

      return uploadImageRes;
    });
  }

  @Implement(contract.sample.sendMessage)
  @UseGuards(HexclaveGuard)
  sendMessage() {
    return implement(contract.sample.sendMessage).handler(async (input) => {
      const res = await this.sampleService.sendMessage(input);

      if (!res.success) {
        throw new Error('Unable to send sample message...');
      }

      return res;
    });
  }

  @Implement(contract.sample.clearQueue)
  @UseGuards(HexclaveGuard)
  clearQueue() {
    return implement(contract.sample.clearQueue).handler(async () => {
      const res = await this.sampleService.clearQueue();

      if (!res.success) {
        throw new Error('Unable to clear sample queue...');
      }

      return res;
    });
  }
}
