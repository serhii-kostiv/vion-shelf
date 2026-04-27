import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GoogleBooksService } from './adapters/google-books.service';
import { TmdbProviderService } from './adapters/tmdb-provider.service';

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [SearchService, GoogleBooksService, TmdbProviderService],
  exports: [SearchService],
})
export class SearchModule {}
