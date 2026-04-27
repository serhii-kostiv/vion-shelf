import { ItemStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateItemDto {
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rating?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  // MediaItem поля
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: object;
}
