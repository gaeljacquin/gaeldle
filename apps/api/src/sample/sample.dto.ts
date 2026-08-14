import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SampleUploadImageDto {
  @ApiProperty({ type: String, description: 'Base64 image string' })
  image!: string;

  @ApiPropertyOptional({ type: String, default: 'jpg' })
  extension?: string;
}

export class SampleSendMessageDto {
  @ApiProperty({ type: String })
  message!: string;
}

export class SampleSendMessageResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiPropertyOptional({ type: String }) messageId?: string;
  @ApiProperty({ type: String }) message!: string;
}

export class SampleClearQueueResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) message!: string;
}

export class UploadImageResponseDto {
  @ApiProperty({ type: Boolean }) success!: boolean;
  @ApiProperty({ type: String }) url!: string;
}
