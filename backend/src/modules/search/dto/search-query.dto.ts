import {
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '@prisma/client';

/**
 * Search Query DTO
 *
 * Validates search request parameters
 */
export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsEnum(Category, { message: 'type must be a valid Category' })
  type?: Category;

  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'limit must be at least 1' })
  @Max(40, { message: 'limit must not exceed 40' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  provider?: string = 'default';
}
