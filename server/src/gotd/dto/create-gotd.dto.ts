import { JsonValue } from '@prisma/client/runtime/library';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateGotdDto {
  @IsNumber()
  @IsNotEmpty()
  modeId: number;

  @IsNumber()
  @IsNotEmpty()
  igdbId: number;

  @IsDateString()
  @IsNotEmpty()
  scheduled: Date;

  @IsOptional()
  info?: JsonValue;
}
