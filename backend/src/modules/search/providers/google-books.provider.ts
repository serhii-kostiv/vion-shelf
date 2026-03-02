import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category } from '@prisma/client';
import { SearchResultDto } from '../dto/search-result.dto';

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
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
  totalItems: number;
}

@Injectable()
export class GoogleBooksProvider {
  private readonly logger = new Logger(GoogleBooksProvider.name);
  private readonly baseUrl = 'https://www.googleapis.com/books/v1';
  private readonly apiKey: string | undefined;
  private readonly cache = new Map<
    string,
    { data: SearchResultDto[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 година

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');
    if (this.apiKey) {
      this.logger.log('Google Books API key configured');
    } else {
      this.logger.warn(
        'Google Books API key not configured - rate limits will be lower',
      );
    }
  }

  async search(query: string, limit: number = 10): Promise<SearchResultDto[]> {
    // Перевіряємо кеш
    const cacheKey = `${query}:${limit}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for query: ${query}`);
      return cached.data;
    }

    try {
      let url = `${this.baseUrl}/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}`;

      // Додаємо API ключ якщо є
      if (this.apiKey) {
        url += `&key=${this.apiKey}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          this.logger.warn('Google Books API rate limit exceeded');
          // Якщо є старий кеш - повертаємо його навіть якщо expired
          if (cached) {
            this.logger.log('Returning expired cache due to rate limit');
            return cached.data;
          }
          // Якщо кешу немає - повертаємо порожній масив замість помилки
          this.logger.warn('No cache available, returning empty results');
          return [];
        }
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = (await response.json()) as GoogleBooksResponse;

      if (!data.items || data.items.length === 0) {
        return [];
      }

      const results = data.items.map((item: GoogleBooksVolume) =>
        this.mapToSearchResult(item),
      );

      // Зберігаємо в кеш
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });

      // Очищаємо старі записи (простий cleanup)
      if (this.cache.size > 100) {
        const firstKey = Array.from(this.cache.keys())[0];
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to search Google Books: ${message}`);

      // Якщо є кеш - повертаємо його при помилці
      if (cached) {
        this.logger.log('Returning cached data due to error');
        return cached.data;
      }

      throw error;
    }
  }

  private mapToSearchResult(volume: GoogleBooksVolume): SearchResultDto {
    const { id, volumeInfo } = volume;

    return {
      externalId: id,
      type: Category.BOOKS,
      title: volumeInfo.title,
      posterUrl:
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail,
      metadata: {
        authors: volumeInfo.authors || [],
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description,
        categories: volumeInfo.categories || [],
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        pageCount: volumeInfo.pageCount,
        language: volumeInfo.language,
      },
    };
  }
}
