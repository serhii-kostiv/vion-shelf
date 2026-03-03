import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddItemDto,
  UpdateItemDto,
} from './dto';
import { JWTGuard } from '../auth/guards/jwt.quard';
import { User } from '@/common/decorators/user.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResult } from '@/common/utils/pagination.util';
import { CollectionOwnershipGuard } from './guards/collection-ownership.guard';
import { ResourceType } from '@/common/decorators/resource-type.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Create a new collection
   * POST /collections
   * @returns 201 Created with collection data
   */
  @Post()
  @UseGuards(JWTGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCollection(
    @User('id') userId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.createCollection(userId, dto);
  }

  /**
   * Get all user's collections with pagination
   * GET /collections
   * @returns 200 OK with paginated collections
   */
  @Get()
  @UseGuards(JWTGuard)
  async getUserCollections(
    @User('id') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<any>> {
    const params = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };
    return this.collectionsService.getUserCollections(userId, params);
  }

  /**
   * Get collection by slug
   * GET /collections/:slug
   * @returns 200 OK with collection data
   */
  @Get(':slug')
  async getCollectionBySlug(@Param('slug') slug: string) {
    return this.collectionsService.getCollectionBySlug(slug);
  }

  /**
   * Update collection
   * PATCH /collections/:id
   * @returns 200 OK with updated collection data
   */
  @Patch(':id')
  @UseGuards(JWTGuard, CollectionOwnershipGuard)
  @ResourceType('collection')
  async updateCollection(
    @Param('id') collectionId: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.updateCollection(collectionId, dto);
  }

  /**
   * Add item to collection
   * POST /collections/:id/items
   * @returns 201 Created with collection item data
   */
  @Post(':id/items')
  @UseGuards(JWTGuard, CollectionOwnershipGuard)
  @ResourceType('collection')
  @HttpCode(HttpStatus.CREATED)
  async addItem(@Param('id') collectionId: string, @Body() dto: AddItemDto) {
    return this.collectionsService.addItemToCollection(collectionId, dto);
  }

  /**
   * Update collection item
   * PATCH /collections/items/:id
   * @returns 200 OK with updated item data
   */
  @Patch('items/:id')
  @UseGuards(JWTGuard, CollectionOwnershipGuard)
  @ResourceType('collectionItem')
  async updateItem(@Param('id') itemId: string, @Body() dto: UpdateItemDto) {
    return this.collectionsService.updateItem(itemId, dto);
  }

  /**
   * Remove item from collection
   * DELETE /collections/items/:id
   * @returns 204 No Content
   */
  @Delete('items/:id')
  @UseGuards(JWTGuard, CollectionOwnershipGuard)
  @ResourceType('collectionItem')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(@Param('id') itemId: string) {
    return this.collectionsService.removeItem(itemId);
  }

  /**
   * Get all media items with pagination
   * GET /collections/items/all
   * @returns 200 OK with paginated media items
   */
  @Get('items/all')
  async getAllMedia(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<any>> {
    const params = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };
    return this.collectionsService.getAllMedia(params);
  }
}
