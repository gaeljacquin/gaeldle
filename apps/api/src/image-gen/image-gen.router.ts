import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Sse,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Observable, merge, EMPTY } from 'rxjs';
import { map, take, filter, mergeMap } from 'rxjs/operators';
import { ImageGenStore, type ImageGenEvent } from '@/image-gen/image-gen.store';
import { ImageGenService } from '@/image-gen/image-gen.service';
import {
  type AuthenticatedRequest,
  HexclaveGuard,
} from '@/auth/hexclave.guard';
import {
  GenerateImageDto,
  GenerateImageResponseDto,
  GenerateImagesDto,
  GenerateImagesResponseDto,
  ImageGenStatusResponseDto,
  DeleteGeneratedImageDto,
  DeleteGeneratedImageResponseDto,
} from '@/image-gen/dto/image-gen.dto';

@ApiTags('imageGen')
@Controller('api/image-gen')
export class ImageGenRouter {
  constructor(
    private readonly imageGenService: ImageGenService,
    private readonly imageGenStore: ImageGenStore,
  ) {}

  @Post('generate-image')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Generate a single AI image for a game' })
  @ApiBody({ type: GenerateImageDto })
  @ApiResponse({ status: 200, type: GenerateImageResponseDto })
  async generateImage(
    @Body() body: GenerateImageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateImageResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const result = await this.imageGenService.generateImage(body, actorId);

    if (!result) {
      throw new NotFoundException('Game not found');
    }

    return result;
  }

  @Post('delete-image')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Delete a generated AI image for a game' })
  @ApiBody({ type: DeleteGeneratedImageDto })
  @ApiResponse({ status: 200, type: DeleteGeneratedImageResponseDto })
  async deleteGeneratedImage(
    @Body() body: DeleteGeneratedImageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DeleteGeneratedImageResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const result = await this.imageGenService.deleteGeneratedImage(
      body,
      actorId,
    );

    if (!result) {
      throw new NotFoundException('Game or generated image not found');
    }

    return result;
  }

  @Post('generate-images')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Generate AI images for multiple games' })
  @ApiBody({ type: GenerateImagesDto })
  @ApiResponse({ status: 200, type: GenerateImagesResponseDto })
  async generateImages(
    @Body() body: GenerateImagesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateImagesResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const { imageGenId, gamesQueued } =
      await this.imageGenService.generateImages(body, actorId);

    return { success: true, imageGenId, gamesQueued };
  }

  @Get('generate-images/:imageGenId/status')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Get bulk image generation status' })
  @ApiParam({ name: 'imageGenId', type: String })
  @ApiResponse({ status: 200, type: ImageGenStatusResponseDto })
  async getImageGenStatus(
    @Param('imageGenId') imageGenId: string,
  ): Promise<ImageGenStatusResponseDto> {
    const result = await this.imageGenService.getImageGenStatus(imageGenId);

    return {
      success: true,
      ...result,
      startedAt: result.startedAt ? result.startedAt.toISOString() : null,
      completedAt: result.completedAt ? result.completedAt.toISOString() : null,
      createdAt: result.createdAt.toISOString(),
    };
  }

  @Sse('generate-images/:imageGenId/stream')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Stream image generation progress via SSE' })
  @ApiParam({ name: 'imageGenId', type: String })
  async stream(
    @Param('imageGenId') imageGenId: string,
  ): Promise<Observable<MessageEvent>> {
    let job: Awaited<ReturnType<ImageGenService['getImageGenStatus']>>;

    try {
      job = await this.imageGenService.getImageGenStatus(imageGenId);
    } catch {
      throw new UnauthorizedException(
        `Image generation ${imageGenId} not found`,
      );
    }

    if (job.status === 'completed' || job.status === 'failed') {
      const completedPayload: ImageGenEvent = {
        type: 'completed',
        data: {
          succeeded: job.succeeded,
          failed: job.failed,
          failures: job.failures,
        },
      };
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next(
          new MessageEvent('message', {
            data: JSON.stringify(completedPayload),
          }),
        );
        subscriber.complete();
      });
    }

    // Subscribe to live events
    const emitter = this.imageGenStore.getOrCreate(imageGenId);

    const events$ = new Observable<ImageGenEvent>((subscriber) => {
      const listener = (event: ImageGenEvent) => subscriber.next(event);
      emitter.on('event', listener);

      return () => emitter.off('event', listener);
    });

    const toMessageEvent = events$.pipe(
      map(
        (event) => new MessageEvent('message', { data: JSON.stringify(event) }),
      ),
    );

    // Complete the observable when we get a 'completed' or 'error' event
    const termination$ = events$.pipe(
      filter((event) => event.type === 'completed' || event.type === 'error'),
      take(1),
      mergeMap(() => EMPTY),
    );

    return merge(toMessageEvent, termination$);
  }
}
