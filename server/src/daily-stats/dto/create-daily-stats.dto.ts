import { JsonArray } from '@prisma/client/runtime/library';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Games } from '~/types/games';

export class CreateDailyStatsDto {
  @IsNumber()
  @IsNotEmpty()
  gotdId: number;

  @IsNumber()
  @IsNotEmpty()
  modeId: number;

  @IsNumber()
  @IsNotEmpty()
  attempts: number;

  @IsArray()
  guesses: Games;

  @IsBoolean()
  @IsNotEmpty()
  found: boolean;

  @IsOptional()
  userId?: number;

  @IsOptional()
  info?: JsonArray;

  @IsBoolean()
  @IsOptional()
  real?: boolean = true;
}
