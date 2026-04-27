import { Injectable, BadRequestException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { GoogleBooksService } from './adapters/google-books.service';
import { TmdbProviderService } from './adapters/tmdb-provider.service';
import { SearchProvider } from './adapters/search-provider.interface';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  private readonly providers = new Map<string, SearchProvider>();

  constructor(
    private readonly googleBooksService: GoogleBooksService,
    private readonly tmdbProvider: TmdbProviderService,
  ) {
    this.providers.set('google-books', this.googleBooksService);
    this.providers.set('tmdb', this.tmdbProvider);
  }

  async search(dto: SearchQueryDto): Promise<SearchResultDto[]> {
    const { query, type, provider = 'default' } = dto;

    // Явно вказаний провайдер
    if (provider !== 'default') {
      if (!type) {
        throw new BadRequestException(
          'Type is required when using a specific provider',
        );
      }
      return this.searchWithProvider(query, type, provider);
    }

    // Роутинг по типу
    if (!type || type === Category.MIXED || type === Category.BOOKS) {
      return this.searchWithProvider(query, Category.BOOKS, 'google-books');
    }

    if (type === Category.MOVIES || type === Category.ANIME) {
      return this.searchWithProvider(query, type, 'tmdb');
    }

    if (type === Category.MANGA) {
      throw new BadRequestException('Manga search not implemented yet');
    }

    if (type === Category.GAMES) {
      throw new BadRequestException('Games search not implemented yet');
    }

    if (type === Category.COURSES) {
      throw new BadRequestException('Courses search not implemented yet');
    }

    return [];
  }

  /**
   * Search using a specific provider from the strategy map
   * @param query - Search query string
   * @param type - Media type/category
   * @param providerName - Provider identifier (e.g., 'tmdb', 'omdb')
   * @returns Array of search results
   */
  private async searchWithProvider(
    query: string,
    type: Category,
    providerName: string,
  ): Promise<SearchResultDto[]> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerName}`);
    }

    const results = await provider.search(query, type);

    return results.map((result) => ({
      externalId: result.externalId,
      type: result.type,
      title: result.title,
      posterUrl: result.posterUrl,
      metadata: {
        ...(result.metadata ?? {}),
        ...(result.releaseYear !== undefined
          ? {
              publishedYear: result.releaseYear,
              releaseYear: result.releaseYear,
            }
          : {}),
      },
    }));
  }
}
