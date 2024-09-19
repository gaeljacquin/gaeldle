import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class UpdateModesDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  lives?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  levelId?: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  pixelation?: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  pixelation_step?: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  categoryId?: number;

  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  hidden?: boolean;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  ordinal?: number;

  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  isNew?: boolean;
}
