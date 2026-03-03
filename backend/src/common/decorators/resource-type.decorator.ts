import { SetMetadata } from '@nestjs/common';

/**
 * Resource Type Decorator
 *
 * Marks an endpoint with the resource type for ownership verification.
 * Used in conjunction with OwnershipGuard to verify user owns the resource.
 *
 * @param resourceType - The Prisma model name (e.g., 'collection', 'collectionItem')
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @UseGuards(JwtAuthGuard, CollectionOwnershipGuard)
 * @ResourceType('collection')
 * async updateCollection(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
 *   return this.collectionsService.updateCollection(id, dto);
 * }
 * ```
 */
export const ResourceType = (resourceType: string) =>
  SetMetadata('resourceType', resourceType);
