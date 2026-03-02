import { Category } from '@prisma/client';

export class SearchResultDto {
  externalId: string;
  type: Category;
  title: string;
  posterUrl?: string;
  metadata: Record<string, any>;
}
