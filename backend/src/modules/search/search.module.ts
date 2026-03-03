import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GoogleBooksProvider } from './providers/google-books.provider';
import { TmdbProviderService } from './providers/tmdb-provider.service';

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [SearchService, GoogleBooksProvider, TmdbProviderService],
  exports: [SearchService],
})
export class SearchModule {}
