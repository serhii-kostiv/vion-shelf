import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Category } from '@prisma/client';
import {
  SearchProvider,
  SearchResult,
  MediaDetails,
} from './search-provider.interface';
import { RetryUtil } from '../../../common/utils/retry.util';
import { AppLoggerService } from '../../../core/logging/logger.service';
import { firstValueFrom } from 'rxjs';

/**
 * TMDB API response interfaces
 */
interface TmdbSearchResponse {
  results: TmdbMovie[] | TmdbTvShow[];
  total_results: number;
  total_pages: number;
}

interface TmdbMovie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
}

interface TmdbTvShow {
  id: number;
  name: string;
  poster_path?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
}

interface TmdbMovieDetails extends TmdbMovie {
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  budget?: number;
  revenue?: number;
}

interface TmdbTvShowDetails extends TmdbTvShow {
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

/**
 * TMDB Provider Service
 * Implements SearchProvider interface with timeout, retry logic, caching, and structured logging
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
@Injectable()
export class TmdbProviderService implements SearchProvider {
  private readonly logger: AppLoggerService;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string;
  private readonly timeout = 8000; // 8 seconds timeout (Requirement 18.1)
  private readonly cache = new Map<
    string,
    { data: SearchResult[] | MediaDetails; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour cache (Requirement 18.4)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new AppLoggerService(TmdbProviderService.name);
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('TMDB API key not configured');
    } else {
      this.logger.log('TMDB Provider initialized');
    }
  }

  /**
   * Search for media items by query string
   * Implements caching and retry logic with exponential backoff
   */
  async search(query: string, type: Category): Promise<SearchResult[]> {
    // Check cache first (Requirement 18.4)
    const cacheKey = `search:${type}:${query}`;
    const cached = this.getCachedData<SearchResult[]>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit for search', { query, type });
      return cached;
    }

    // Map Category to TMDB endpoint
    const endpoint = this.mapCategoryToEndpoint(type);
    if (!endpoint) {
      this.logger.warn('Unsupported category for TMDB', { type });
      return [];
    }

    try {
      // Execute with retry logic (Requirement 18.2)
      const results = await RetryUtil.withRetry(
        () => this.executeSearch(query, endpoint),
        {
          maxAttempts: 3,
          delayMs: 1000,
          exponentialBackoff: true,
        },
      );

      // Cache the results (Requirement 18.4)
      this.setCachedData(cacheKey, results);

      return results;
    } catch (error) {
      // Structured error logging with request context (Requirement 18.5)
      this.logger.error('TMDB search failed', {
        query,
        type,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ServiceUnavailableException(
        'Search service temporarily unavailable',
      );
    }
  }

  /**
   * Get detailed information about a specific media item
   */
  async getDetails(externalId: string, type: Category): Promise<MediaDetails> {
    // Check cache first
    const cacheKey = `details:${type}:${externalId}`;
    const cached = this.getCachedData<MediaDetails>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit for details', { externalId, type });
      return cached;
    }

    // Extract numeric ID from externalId (format: "tmdb:12345")
    const tmdbId = externalId.replace('tmdb:', '');
    const endpoint = this.mapCategoryToEndpoint(type);

    if (!endpoint) {
      throw new ServiceUnavailableException('Unsupported media type');
    }

    try {
      // Execute with retry logic
      const details = await RetryUtil.withRetry(
        () => this.executeGetDetails(tmdbId, endpoint),
        {
          maxAttempts: 3,
          delayMs: 1000,
          exponentialBackoff: true,
        },
      );

      // Cache the results
      this.setCachedData(cacheKey, details);

      return details;
    } catch (error) {
      // Structured error logging
      this.logger.error('TMDB get details failed', {
        externalId,
        type,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ServiceUnavailableException(
        'Search service temporarily unavailable',
      );
    }
  }

  /**
   * Execute search request with timeout (Requirement 18.1)
   */
  private async executeSearch(
    query: string,
    endpoint: string,
  ): Promise<SearchResult[]> {
    const url = `${this.baseUrl}/search/${endpoint}`;

    const response = await firstValueFrom(
      this.httpService.get<TmdbSearchResponse>(url, {
        params: {
          api_key: this.apiKey,
          query,
        },
        timeout: this.timeout, // Timeout configuration (Requirement 18.1)
      }),
    );

    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }

    return response.data.results.map((item) =>
      this.transformToSearchResult(item as TmdbMovie | TmdbTvShow, endpoint),
    );
  }

  /**
   * Execute get details request with timeout
   */
  private async executeGetDetails(
    tmdbId: string,
    endpoint: string,
  ): Promise<MediaDetails> {
    const url = `${this.baseUrl}/${endpoint}/${tmdbId}`;

    const response = await firstValueFrom(
      this.httpService.get<TmdbMovieDetails | TmdbTvShowDetails>(url, {
        params: {
          api_key: this.apiKey,
        },
        timeout: this.timeout,
      }),
    );

    return this.transformToMediaDetails(response.data, endpoint);
  }

  /**
   * Transform TMDB response to SearchResult
   */
  private transformToSearchResult(
    item: TmdbMovie | TmdbTvShow,
    endpoint: string,
  ): SearchResult {
    const isMovie = endpoint === 'movie';
    const movieItem = item as TmdbMovie;
    const tvItem = item as TmdbTvShow;

    return {
      externalId: `tmdb:${item.id}`,
      type: isMovie ? Category.MOVIES : Category.ANIME, // Map TV shows to ANIME for now
      title: isMovie ? movieItem.title : tvItem.name,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : undefined,
      releaseYear: isMovie
        ? movieItem.release_date
          ? new Date(movieItem.release_date).getFullYear()
          : undefined
        : tvItem.first_air_date
          ? new Date(tvItem.first_air_date).getFullYear()
          : undefined,
    };
  }

  /**
   * Transform TMDB details response to MediaDetails
   */
  private transformToMediaDetails(
    item: TmdbMovieDetails | TmdbTvShowDetails,
    endpoint: string,
  ): MediaDetails {
    const isMovie = endpoint === 'movie';
    const movieItem = item as TmdbMovieDetails;
    const tvItem = item as TmdbTvShowDetails;

    return {
      externalId: `tmdb:${item.id}`,
      type: isMovie ? Category.MOVIES : Category.ANIME,
      title: isMovie ? movieItem.title : tvItem.name,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : undefined,
      releaseYear: isMovie
        ? movieItem.release_date
          ? new Date(movieItem.release_date).getFullYear()
          : undefined
        : tvItem.first_air_date
          ? new Date(tvItem.first_air_date).getFullYear()
          : undefined,
      description: item.overview,
      genres: item.genres?.map((g) => g.name),
      rating: item.vote_average,
      metadata: {
        tmdbId: item.id,
        genreIds: item.genre_ids,
        ...(isMovie
          ? {
              runtime: movieItem.runtime,
              budget: movieItem.budget,
              revenue: movieItem.revenue,
            }
          : {
              numberOfSeasons: tvItem.number_of_seasons,
              numberOfEpisodes: tvItem.number_of_episodes,
            }),
      },
    };
  }

  /**
   * Map Category to TMDB endpoint
   */
  private mapCategoryToEndpoint(type: Category): string | null {
    switch (type) {
      case Category.MOVIES:
        return 'movie';
      case Category.ANIME:
        return 'tv'; // TMDB doesn't have separate anime endpoint, use TV shows
      default:
        return null;
    }
  }

  /**
   * Get cached data if not expired (Requirement 18.4)
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Set cached data with timestamp (Requirement 18.4)
   */
  private setCachedData(
    key: string,
    data: SearchResult[] | MediaDetails,
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Simple cache cleanup - remove oldest entries if cache grows too large
    if (this.cache.size > 100) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }
}
