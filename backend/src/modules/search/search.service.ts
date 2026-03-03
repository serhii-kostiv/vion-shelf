import { Injectable, BadRequestException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { GoogleBooksProvider } from './providers/google-books.provider';
import { TmdbProviderService } from './providers/tmdb-provider.service';
import { SearchProvider } from './providers/search-provider.interface';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  private readonly providers = new Map<string, SearchProvider>();

  constructor(
    private readonly googleBooksProvider: GoogleBooksProvider,
    private readonly tmdbProvider: TmdbProviderService,
  ) {
    // Register providers in the Map for strategy pattern
    // Note: GoogleBooksProvider doesn't implement SearchProvider interface yet,
    // so we only register TMDB for now
    this.providers.set('tmdb', this.tmdbProvider);
  }

  async search(dto: SearchQueryDto): Promise<SearchResultDto[]> {
    const { query, type, limit = 10, provider = 'default' } = dto;

    // Strategy pattern: select provider based on type and provider parameter
    if (provider !== 'default') {
      // Use explicitly specified provider
      if (!type) {
        throw new BadRequestException(
          'Type is required when using a specific provider',
        );
      }
      return this.searchWithProvider(query, type, provider);
    }

    // Default behavior: route by type
    if (!type || type === Category.MIXED || type === Category.BOOKS) {
      return await this.googleBooksProvider.search(query, limit);
    }

    if (type === Category.MOVIES || type === Category.ANIME) {
      return this.searchWithProvider(query, type, 'tmdb');
    }

    // Інші типи поки не підтримуються
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

    // Use the provider's search method (SearchProvider interface)
    const results = await provider.search(query, type);

    // Transform SearchResult[] to SearchResultDto[]
    return results.map((result) => ({
      externalId: result.externalId,
      type: result.type,
      title: result.title,
      posterUrl: result.posterUrl,
      metadata: {
        releaseYear: result.releaseYear,
      },
    }));
  }
}
