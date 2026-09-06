import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeStoryline?: boolean;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeGenres?: boolean;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeThemes?: boolean;
  @ApiPropertyOptional({ type: String }) artStyle?: string;
  @ApiProperty({ type: String }) provider!: string;
}

export class GenerateImageResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiPropertyOptional({ type: String }) messageId?: string;
}

export class GenerateImagesDto {
  @ApiProperty({ type: Number }) numGames!: number;
  @ApiProperty({ type: String }) artStyle!: string;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeStoryline?: boolean;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeGenres?: boolean;
  @ApiPropertyOptional({ type: Boolean, default: false })
  includeThemes?: boolean;
  @ApiProperty({ type: String }) provider!: string;
}

export class GenerateImagesResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) imageGenId!: string;
  @ApiProperty({ type: Number }) gamesQueued!: number;
}

export class ImageGenFailureDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) gameName!: string;
  @ApiProperty({ type: String }) error!: string;
}

export class ImageGenStatusResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) imageGenId!: string;
  @ApiProperty({ type: String }) status!: string;
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) processed!: number;
  @ApiProperty({ type: Number }) succeeded!: number;
  @ApiProperty({ type: Number }) failed!: number;
  @ApiProperty({ type: [ImageGenFailureDto] }) failures!: ImageGenFailureDto[];
  @ApiProperty({ type: Object }) params!: any;
  @ApiPropertyOptional({ type: String, nullable: true }) startedAt!:
    string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) completedAt!:
    string | null;
  @ApiProperty({ type: String }) createdAt!: string;
}

export class DeleteGeneratedImageDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) artStyle!: string;
}

export class DeleteGeneratedImageResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiPropertyOptional({ type: Object }) data?: any;
}
