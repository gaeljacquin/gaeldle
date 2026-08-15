import { ApiProperty } from '@nestjs/swagger';

export class GenerateClueDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) provider!: string;
}

export class GenerateClueResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: Object }) data!: any;
}

export class RestoreClueDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: Number }) historyId!: number;
}

export class GameClueHistoryDto {
  @ApiProperty({ type: Number }) id!: number;
  @ApiProperty({ type: Number }) gameId!: number;
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String }) clue!: string;
  @ApiProperty({ type: String }) prompt!: string;
  @ApiProperty({ type: String }) provider!: string;
  @ApiProperty({ type: String }) model!: string;
  @ApiProperty({ type: String }) occurredAt!: string;
}
