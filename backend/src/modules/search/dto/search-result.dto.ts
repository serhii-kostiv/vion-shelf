import { Category } from '@prisma/client';
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

/**
 * Search Result DTO
 *
 * Represents a single search result from external providers
 */
export class SearchResultDto {
  @IsString()
  externalId: string;

  @IsEnum(Category)
  type: Category;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsObject()
  metadata: Record<string, unknown>;
}
