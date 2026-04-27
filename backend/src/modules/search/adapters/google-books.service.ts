import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from '@prisma/client';
import { AppLoggerService } from '../../../core/logging/logger.service';
import {
  MediaDetails,
  SearchProvider,
  SearchResult,
} from './search-provider.interface';

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    pageCount?: number;
    language?: string;
    publisher?: string;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
  totalItems: number;
}

@Injectable()
export class GoogleBooksService implements SearchProvider {
  private readonly logger: AppLoggerService;
  private readonly baseUrl = 'https://www.googleapis.com/books/v1';
  private readonly apiKey: string | undefined;
  private readonly cache = new Map<
    string,
    { data: SearchResult[] | MediaDetails; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 година

  constructor(private readonly configService: ConfigService) {
    this.logger = new AppLoggerService(GoogleBooksService.name);
    this.apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');

    if (this.apiKey) {
      this.logger.log('Google Books API key configured');
    } else {
      this.logger.warn(
        'Google Books API key not configured - rate limits will be lower',
      );
    }
  }

  async search(query: string, type: Category): Promise<SearchResult[]> {
    if (type !== Category.BOOKS) {
      return [];
    }

    const cacheKey = `search:${query}`;
    const cached = this.getCachedData<SearchResult[]>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit for search', { query });
      return cached;
    }

    try {
      const results = await this.executeSearch(query);
      this.setCachedData(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error('Google Books search failed', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ServiceUnavailableException(
        'Search service temporarily unavailable',
      );
    }
  }

  async getDetails(externalId: string, type: Category): Promise<MediaDetails> {
    if (type !== Category.BOOKS) {
      throw new ServiceUnavailableException('Unsupported media type');
    }

    const cacheKey = `details:${externalId}`;
    const cached = this.getCachedData<MediaDetails>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit for details', { externalId });
      return cached;
    }

    try {
      const details = await this.executeGetDetails(externalId);
      this.setCachedData(cacheKey, details);
      return details;
    } catch (error) {
      this.logger.error('Google Books get details failed', {
        externalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ServiceUnavailableException(
        'Search service temporarily unavailable',
      );
    }
  }

  private async executeSearch(query: string): Promise<SearchResult[]> {
    const url = this.buildUrl(`/volumes`, { q: query, maxResults: '10' });
    const response = await this.fetchWithRateLimit(url);
    const data = (await response.json()) as GoogleBooksResponse;

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item) => this.transformToSearchResult(item));
  }

  private async executeGetDetails(externalId: string): Promise<MediaDetails> {
    const url = this.buildUrl(`/volumes/${externalId}`);
    const response = await this.fetchWithRateLimit(url);
    const volume = (await response.json()) as GoogleBooksVolume;
    return this.transformToMediaDetails(volume);
  }

  private transformToSearchResult(
    volume: GoogleBooksVolume,
  ): SearchResult & { metadata: Record<string, unknown> } {
    const { id, volumeInfo } = volume;
    const year = this.parseYear(volumeInfo.publishedDate);

    return {
      externalId: id,
      type: Category.BOOKS,
      title: volumeInfo.title,
      posterUrl:
        volumeInfo.imageLinks?.thumbnail ??
        volumeInfo.imageLinks?.smallThumbnail,
      releaseYear: year,
      metadata: {
        authors: volumeInfo.authors ?? [],
        publisher: volumeInfo.publisher,
        publishedYear: year,
        genres: volumeInfo.categories?.join(', '),
        pageCount: volumeInfo.pageCount,
        language: volumeInfo.language,
      },
    };
  }

  private transformToMediaDetails(volume: GoogleBooksVolume): MediaDetails {
    const { id, volumeInfo } = volume;
    const year = this.parseYear(volumeInfo.publishedDate);

    const isbn = volumeInfo.industryIdentifiers?.find(
      (i) => i.type === 'ISBN_13' || i.type === 'ISBN_10',
    )?.identifier;

    return {
      externalId: id,
      type: Category.BOOKS,
      title: volumeInfo.title,
      posterUrl:
        volumeInfo.imageLinks?.thumbnail ??
        volumeInfo.imageLinks?.smallThumbnail,
      releaseYear: year,
      description: volumeInfo.description,
      genres: volumeInfo.categories,
      rating: volumeInfo.averageRating,
      metadata: {
        authors: volumeInfo.authors ?? [],
        publisher: volumeInfo.publisher,
        pageCount: volumeInfo.pageCount,
        language: volumeInfo.language,
        isbn,
        ratingsCount: volumeInfo.ratingsCount,
      },
    };
  }

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (this.apiKey) {
      url.searchParams.set('key', this.apiKey);
    }
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async fetchWithRateLimit(url: string): Promise<Response> {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        this.logger.warn('Google Books API rate limit exceeded');
        throw new ServiceUnavailableException('Rate limit exceeded');
      }
      throw new Error(`Google Books API error: ${response.status}`);
    }

    return response;
  }

  private parseYear(dateStr?: string): number | undefined {
    if (!dateStr) return undefined;
    const year = parseInt(dateStr.substring(0, 4), 10);
    return isNaN(year) ? undefined : year;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    if (cached) this.cache.delete(key);
    return null;
  }

  private setCachedData(
    key: string,
    data: SearchResult[] | MediaDetails,
  ): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    if (this.cache.size > 100) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey) this.cache.delete(firstKey);
    }
  }
}
