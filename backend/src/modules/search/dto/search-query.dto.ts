import { IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '@prisma/client';

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(Category)
  type?: Category;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(40)
  limit?: number = 10;
}
