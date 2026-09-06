import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SampleService } from '@/sample/sample.service';
import {
  type AuthenticatedRequest,
  HexclaveGuard,
} from '@/auth/hexclave.guard';
import {
  SampleUploadImageDto,
  SampleSendMessageDto,
  SampleSendMessageResponseDto,
  SampleClearQueueResponseDto,
  UploadImageResponseDto,
} from '@/sample/sample.dto';

@ApiTags('sample')
@Controller('api/sample')
export class SampleRouter {
  constructor(private readonly sampleService: SampleService) {}

  @Post('upload-image')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Upload sample image' })
  @ApiBody({ type: SampleUploadImageDto })
  @ApiResponse({ status: 200, type: UploadImageResponseDto })
  async uploadImage(
    @Body() body: SampleUploadImageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadImageResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    return this.sampleService.uploadImage(
      { image: body.image, extension: body.extension ?? 'jpg' },
      actorId,
    );
  }

  @Post('send-message')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Send sample message to queue' })
  @ApiBody({ type: SampleSendMessageDto })
  @ApiResponse({ status: 200, type: SampleSendMessageResponseDto })
  async sendMessage(
    @Body() body: SampleSendMessageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SampleSendMessageResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    return this.sampleService.sendMessage(body, actorId);
  }

  @Post('clear-queue')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Clear sample message queue' })
  @ApiResponse({ status: 200, type: SampleClearQueueResponseDto })
  async clearQueue(
    @Req() req: AuthenticatedRequest,
  ): Promise<SampleClearQueueResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    return this.sampleService.clearQueue(actorId);
  }
}
