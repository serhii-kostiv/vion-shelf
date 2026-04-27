import { Category } from '@prisma/client';

/**
 * Search result returned by search providers
 */
export interface SearchResult {
  /** External ID from the provider (e.g., "tmdb:12345", "google-books:abc123") */
  externalId: string;

  /** Media type/category */
  type: Category;

  /** Title of the media item */
  title: string;

  /** URL to poster/cover image */
  posterUrl?: string;

  /** Release year for movies/shows, publication year for books */
  releaseYear?: number;

  /** Optional metadata already available from search (avoids extra getDetails call) */
  metadata?: Record<string, unknown>;
}

/**
 * Detailed media information including metadata
 */
export interface MediaDetails extends SearchResult {
  /** Description or synopsis */
  description?: string;

  /** Array of genre names */
  genres?: string[];

  /** Rating (0-10 scale) */
  rating?: number;

  /** Additional provider-specific metadata */
  metadata: Record<string, any>;
}

/**
 * Interface for search providers (TMDB, OMDB, Google Books, etc.)
 * Implements Strategy Pattern for interchangeable search providers
 */
export interface SearchProvider {
  /**
   * Search for media items by query string
   * @param query - Search query string
   * @param type - Media type/category to search for
   * @returns Array of search results
   */
  search(query: string, type: Category): Promise<SearchResult[]>;

  /**
   * Get detailed information about a specific media item
   * @param externalId - External ID from the provider
   * @param type - Media type/category
   * @returns Detailed media information
   */
  getDetails(externalId: string, type: Category): Promise<MediaDetails>;
}
