import { Category } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Category)
  category: Category;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
