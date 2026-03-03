import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '@/core/logging/logger.service';

/**
 * Health Check Service
 *
 * Monitors application health including database and external APIs
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(HealthService.name);
  }

  /**
   * Basic health check
   *
   * @returns Application status and timestamp
   */
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Database health check
   *
   * Performs a simple query to verify database connectivity
   *
   * @returns Database connection status
   * @throws ServiceUnavailableException if database is unreachable
   */
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      this.logger.debug('Database health check passed');

      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new ServiceUnavailableException('Database is unavailable');
    }
  }

  /**
   * External APIs health check
   *
   * Checks availability of external API providers (TMDB, Google Books)
   *
   * @returns Status of each external API
   */
  async checkExternalApis() {
    const tmdbApiKey = this.config.get<string>('TMDB_API_KEY');
    const googleBooksApiKey = this.config.get<string>('GOOGLE_BOOKS_API_KEY');

    const results = {
      tmdb: await this.checkTmdbApi(tmdbApiKey),
      googleBooks: await this.checkGoogleBooksApi(googleBooksApiKey),
    };

    const allHealthy = Object.values(results).every((r) => r.status === 'ok');

    return {
      status: allHealthy ? 'ok' : 'degraded',
      apis: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check TMDB API availability
   */
  private async checkTmdbApi(
    apiKey: string | undefined,
  ): Promise<{ status: string; message?: string }> {
    if (!apiKey) {
      return { status: 'unconfigured', message: 'API key not configured' };
    }

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (response.ok) {
        return { status: 'ok' };
      }

      return {
        status: 'error',
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      this.logger.warn('TMDB API health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Google Books API availability
   */
  private async checkGoogleBooksApi(
    apiKey: string | undefined,
  ): Promise<{ status: string; message?: string }> {
    if (!apiKey) {
      return { status: 'unconfigured', message: 'API key not configured' };
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=test&key=${apiKey}&maxResults=1`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (response.ok) {
        return { status: 'ok' };
      }

      return {
        status: 'error',
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      this.logger.warn('Google Books API health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
