import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiscoverScanDto {
  @ApiProperty({
    type: Number,
    description: 'Number of games to scan',
    minimum: 1,
    maximum: 50,
  })
  count!: number;
}

export class DiscoverCandidateDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) name!: string;
  @ApiPropertyOptional({ type: Number, nullable: true }) firstReleaseDate!:
    number | null;
  @ApiPropertyOptional({ type: String, nullable: true }) coverUrl!:
    string | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) totalRating!:
    number | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) totalRatingCount!:
    number | null;
  @ApiProperty({ type: [String] }) genres!: string[];
  @ApiProperty({ type: [String] }) platforms!: string[];
  @ApiProperty({ type: Boolean }) isAlreadyAdded!: boolean;
}

export class DiscoverScanResponseDto {
  @ApiProperty({ type: Number }) scanEventId!: number;
  @ApiProperty({ type: [DiscoverCandidateDto] })
  candidates!: DiscoverCandidateDto[];
  @ApiProperty({ type: Number }) totalReturned!: number;
  @ApiProperty({ type: Number }) alreadyAddedCount!: number;
}

export class DiscoverApplyDto {
  @ApiProperty({ type: Number }) scanEventId!: number;
  @ApiProperty({ type: [Number] }) selectedIgdbIds!: number[];
}

export class DiscoverApplyResultDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiPropertyOptional({ type: String, nullable: true }) name!: string | null;
  @ApiProperty({ enum: ['created', 'updated', 'error'] }) status!:
    'created' | 'updated' | 'error';
  @ApiPropertyOptional({ type: String, nullable: true }) error!: string | null;
}

export class DiscoverApplyResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: Number }) applyEventId!: number;
  @ApiProperty({ type: [DiscoverApplyResultDto] })
  results!: DiscoverApplyResultDto[];
}
