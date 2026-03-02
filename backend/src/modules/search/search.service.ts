import { Injectable, BadRequestException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { GoogleBooksProvider } from './providers/google-books.provider';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(private readonly googleBooksProvider: GoogleBooksProvider) {}

  async search(dto: SearchQueryDto): Promise<SearchResultDto[]> {
    const { query, type, limit = 10 } = dto;

    // Якщо тип не вказаний або MIXED - шукаємо тільки книги поки що
    if (!type || type === Category.MIXED || type === Category.BOOKS) {
      return await this.googleBooksProvider.search(query, limit);
    }

    // Інші типи поки не підтримуються
    if (type === Category.MOVIES) {
      throw new BadRequestException('Movies search not implemented yet');
    }

    if (type === Category.ANIME || type === Category.MANGA) {
      throw new BadRequestException('Anime/Manga search not implemented yet');
    }

    if (type === Category.GAMES) {
      throw new BadRequestException('Games search not implemented yet');
    }

    if (type === Category.COURSES) {
      throw new BadRequestException('Courses search not implemented yet');
    }

    return [];
  }
}
