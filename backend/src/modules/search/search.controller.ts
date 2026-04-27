import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { JWTGuard } from '@/modules/auth/guards/jwt.quard';

/**
 * Search Controller
 *
 * Handles HTTP requests for searching external media providers
 * Thin HTTP layer - delegates all business logic to SearchService
 */
@Controller('search')
@UseGuards(JWTGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Search for media across external providers
   *
   * @param query - Search parameters (query, type, limit, provider)
   * @returns Array of search results
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto[]> {
    return this.searchService.search(query);
  }
}
