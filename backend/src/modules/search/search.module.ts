import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GoogleBooksProvider } from './providers/google-books.provider';

@Module({
  controllers: [SearchController],
  providers: [SearchService, GoogleBooksProvider],
  exports: [SearchService],
})
export class SearchModule {}
