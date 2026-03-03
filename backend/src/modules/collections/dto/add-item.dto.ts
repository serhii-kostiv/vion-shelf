import { ItemStatus, Category } from '@prisma/client';
import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';

class MediaItemDataDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(Category)
  type: Category;

  @IsString()
  @MaxLength(255)
  externalId: string;

  @IsUrl()
  @IsOptional()
  posterUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: object;
}

class CollectionItemDataDto {
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus = ItemStatus.PLANNED;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rating?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  progress?: number = 0;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class AddItemDto {
  @ValidateNested()
  @Type(() => MediaItemDataDto)
  mediaItem: MediaItemDataDto;

  @ValidateNested()
  @Type(() => CollectionItemDataDto)
  @IsOptional()
  collectionItem?: CollectionItemDataDto;
}
