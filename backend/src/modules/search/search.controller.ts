import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { JWTGuard } from '@/modules/auth/guards/jwt.quard';

@Controller('search')
@UseGuards(JWTGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto[]> {
    return await this.searchService.search(query);
  }
}
