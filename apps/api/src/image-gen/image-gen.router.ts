import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  Param,
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
import { ImageGenService } from './image-gen.service';
import {
  type AuthenticatedRequest,
  HexclaveGuard,
} from '../auth/hexclave.guard';
import {
  GenerateImageDto,
  GenerateImageResponseDto,
  SingleImageGenStatusResponseDto,
  GenerateImagesDto,
  GenerateImagesResponseDto,
  ImageGenStatusResponseDto,
  DeleteGeneratedImageDto,
  DeleteGeneratedImageResponseDto,
} from './dto/image-gen.dto';

@ApiTags('imageGen')
@Controller('api/image-gen')
export class ImageGenRouter {
  constructor(private readonly imageGenService: ImageGenService) {}

  @Post('generate-image')
  @HttpCode(202)
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Generate a single AI image for a game' })
  @ApiBody({ type: GenerateImageDto })
  @ApiResponse({ status: 202, type: GenerateImageResponseDto })
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

  @Get('generate-image/:jobId/status')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Get single AI image generation status' })
  @ApiParam({ name: 'jobId', type: String })
  @ApiResponse({ status: 200, type: SingleImageGenStatusResponseDto })
  async getSingleImageGenStatus(
    @Param('jobId') jobId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SingleImageGenStatusResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const result = await this.imageGenService.getSingleImageGenStatus(
      jobId,
      actorId,
    );

    return {
      success: true,
      ...result,
      startedAt: result.startedAt ? result.startedAt.toISOString() : null,
      completedAt: result.completedAt ? result.completedAt.toISOString() : null,
      createdAt: result.createdAt.toISOString(),
    };
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
  @HttpCode(202)
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Generate AI images for multiple games' })
  @ApiBody({ type: GenerateImagesDto })
  @ApiResponse({ status: 202, type: GenerateImagesResponseDto })
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
    @Req() req: AuthenticatedRequest,
  ): Promise<ImageGenStatusResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const result = await this.imageGenService.getImageGenStatus(
      imageGenId,
      actorId,
    );

    return {
      success: true,
      ...result,
      startedAt: result.startedAt ? result.startedAt.toISOString() : null,
      completedAt: result.completedAt ? result.completedAt.toISOString() : null,
      createdAt: result.createdAt.toISOString(),
    };
  }
}
