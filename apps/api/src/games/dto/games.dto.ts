import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncGameDto {
  @ApiProperty({
    type: Number,
    description: 'IGDB ID of the game',
    example: 1234,
  })
  igdb_id!: number;
}

export class GameUpdateInputDto {
  @ApiPropertyOptional({ type: String }) name?: string;
  @ApiPropertyOptional({ type: String }) imageUrl?: string;
  @ApiPropertyOptional({ type: String }) aiImageUrl?: string;
  @ApiPropertyOptional({ type: String }) aiPrompt?: string;
  @ApiPropertyOptional({ type: String }) summary?: string;
  @ApiPropertyOptional({ type: String }) storyline?: string;
  @ApiPropertyOptional({ type: Number }) firstReleaseDate?: number;
  @ApiPropertyOptional({ type: Object }) artworks?: any;
  @ApiPropertyOptional({ type: Object }) keywords?: any;
  @ApiPropertyOptional({ type: Object }) franchises?: any;
  @ApiPropertyOptional({ type: Object }) gameEngines?: any;
  @ApiPropertyOptional({ type: Object }) gameModes?: any;
  @ApiPropertyOptional({ type: Object }) genres?: any;
  @ApiPropertyOptional({ type: Object }) involvedCompanies?: any;
  @ApiPropertyOptional({ type: Object }) platforms?: any;
  @ApiPropertyOptional({ type: Object }) playerPerspectives?: any;
  @ApiPropertyOptional({ type: Object }) releaseDates?: any;
  @ApiPropertyOptional({ type: Object }) themes?: any;
}

export class DeleteBulkDto {
  @ApiProperty({ type: [Number], description: 'Array of game IDs to delete' })
  ids!: number[];
}

export class TestUploadDto {
  @ApiProperty({ type: String, description: 'Base64 image content' })
  image!: string;

  @ApiPropertyOptional({ type: String, default: 'jpg' })
  extension?: string;
}

export class ValidateIgdbIdAddDto {
  @ApiProperty({ type: Number, description: 'IGDB ID to validate' })
  igdbId!: number;
}

export class TestSendMessageDto {
  @ApiProperty({ type: String })
  message!: string;
}

export class SyncGameDataDto {
  @ApiProperty({ type: Number }) id!: number;
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: String }) name!: string;
}

export class SyncGameResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) message!: string;
  @ApiProperty({ enum: ['created', 'updated'] }) operation!:
    'created' | 'updated';
  @ApiProperty({ type: SyncGameDataDto }) data!: SyncGameDataDto;
}

export class GameResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: Object }) data!: any;
}

export class DeleteGameDataDto {
  @ApiProperty({ type: Number }) id!: number;
}

export class DeleteGameResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: DeleteGameDataDto }) data!: DeleteGameDataDto;
}

export class DeleteBulkGamesDataDto {
  @ApiProperty({ type: [Number] }) deletedIds!: number[];
}

export class DeleteBulkGamesResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: DeleteBulkGamesDataDto }) data!: DeleteBulkGamesDataDto;
}

export class UploadResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) url!: string;
}

export class ValidateIgdbIdAddResponseDto {
  @ApiProperty({ type: Number }) igdbId!: number;
  @ApiProperty({ type: Boolean }) existsOnIgdb!: boolean;
  @ApiProperty({ type: Boolean }) alreadyInDb!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true }) gameName!:
    string | null;
  @ApiProperty({ type: Boolean }) canAdd!: boolean;
}
