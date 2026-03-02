import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { JWTGuard } from '../auth/guards/jwt.quard';
import { User } from '@/common/decorators/user.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // POST /collections - Створити нову колекцію
  @Post()
  @UseGuards(JWTGuard)
  async createCollection(
    @User('id') userId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.createCollection(userId, dto);
  }

  // GET /collections - Отримати всі свої колекції
  @Get()
  @UseGuards(JWTGuard)
  async getUserCollections(@User('id') userId: string) {
    return this.collectionsService.getUserCollections(userId);
  }

  // GET /collections/:slug - Отримати колекцію за slug
  @Get(':slug')
  async getCollectionBySlug(@Param('slug') slug: string) {
    return this.collectionsService.getCollectionBySlug(slug);
  }

  // POST /collections/:id/items - Додати елемент до колекції
  @Post(':id/items')
  @UseGuards(JWTGuard)
  async addItem(@Param('id') collectionId: string, @Body() dto: AddItemDto) {
    return this.collectionsService.addItemToCollection(collectionId, dto);
  }

  // PATCH /collections/items/:id - Оновити елемент
  @Patch('items/:id')
  @UseGuards(JWTGuard)
  async updateItem(
    @Param('id') itemId: string,
    @Body() dto: Partial<AddItemDto>,
  ) {
    return this.collectionsService.updateItem(itemId, dto);
  }

  // DELETE /collections/items/:id - Видалити елемент
  @Delete('items/:id')
  @UseGuards(JWTGuard)
  async removeItem(@Param('id') itemId: string) {
    return this.collectionsService.removeItem(itemId);
  }

  // GET /collections/items - Отримати всі MediaItem
  @Get('items/all')
  async getAllMedia() {
    return this.collectionsService.getAllMedia();
  }
}
