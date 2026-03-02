import { Category, ItemStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class AddItemDto {
  // Дані про медіа (для MediaItem)
  @IsString()
  title: string;

  @IsEnum(Category)
  type: Category;

  @IsString()
  externalId: string;

  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: object;

  // Персональні дані користувача (для CollectionItem)
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
  notes?: string;
}
