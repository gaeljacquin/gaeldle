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
      const sendMessageRes = await this.sampleService.sendMessage(input);

      if (!sendMessageRes.success) {
        throw new Error('Unable to send sample message...');
      }

      return sendMessageRes;
    });
  }

  @Implement(contract.sample.purgeQueue)
  @UseGuards(HexclaveGuard)
  purgeQueue() {
    return implement(contract.sample.purgeQueue).handler(async () => {
      const purgeQueueRes = await this.sampleService.purgeQueue();

      if (!purgeQueueRes.success) {
        throw new Error('Unable to clear sample queue...');
      }

      return purgeQueueRes;
    });
  }
}
