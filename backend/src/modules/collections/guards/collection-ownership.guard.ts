import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/core/prisma/prisma.service';

/**
 * Collection Ownership Guard
 *
 * Verifies that the authenticated user owns the collection before allowing operations.
 * Uses @ResourceType() decorator to determine which resource to check.
 *
 * Supported resource types:
 * - 'collection': Checks Collection.userId matches authenticated user
 * - 'collectionItem': Checks CollectionItem -> Collection.userId matches authenticated user
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @UseGuards(JwtAuthGuard, CollectionOwnershipGuard)
 * @ResourceType('collection')
 * async updateCollection(
 *   @Param('id') id: string,
 *   @Body() dto: UpdateCollectionDto
 * ) {
 *   return this.collectionsService.updateCollection(id, dto);
 * }
 * ```
 *
 * Requirements:
 * - User must be authenticated (use JwtAuthGuard before this guard)
 * - Request must have 'id' parameter
 * - Endpoint must have @ResourceType() decorator
 */
@Injectable()
export class CollectionOwnershipGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Determines if the request can proceed based on resource ownership
   *
   * @param context - Execution context containing request information
   * @returns true if user owns the resource, throws exception otherwise
   * @throws NotFoundException if resource doesn't exist
   * @throws ForbiddenException if user doesn't own the resource
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: { id: string };
      params: { id: string };
    }>();
    const user = request.user;
    const resourceId = request.params.id;

    // Get resource type from @ResourceType() decorator
    const resourceType = this.reflector.get<string>(
      'resourceType',
      context.getHandler(),
    );

    // If no resource type specified, skip ownership check
    if (!resourceType) {
      return true;
    }

    // Verify ownership based on resource type
    await this.verifyOwnership(resourceType, resourceId, user.id);

    return true;
  }

  /**
   * Verifies ownership for different resource types
   *
   * @param resourceType - Type of resource ('collection' or 'collectionItem')
   * @param resourceId - ID of the resource
   * @param userId - ID of the authenticated user
   * @throws NotFoundException if resource doesn't exist
   * @throws ForbiddenException if user doesn't own the resource
   */
  private async verifyOwnership(
    resourceType: string,
    resourceId: string,
    userId: string,
  ): Promise<void> {
    switch (resourceType) {
      case 'collection':
        await this.verifyCollectionOwnership(resourceId, userId);
        break;

      case 'collectionItem':
        await this.verifyCollectionItemOwnership(resourceId, userId);
        break;

      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }

  /**
   * Verifies user owns the collection
   */
  private async verifyCollectionOwnership(
    collectionId: string,
    userId: string,
  ): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You do not own this collection');
    }
  }

  /**
   * Verifies user owns the collection that contains the item
   */
  private async verifyCollectionItemOwnership(
    itemId: string,
    userId: string,
  ): Promise<void> {
    const item = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
      select: {
        collection: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Collection item not found');
    }

    if (item.collection.userId !== userId) {
      throw new ForbiddenException('You do not own this collection item');
    }
  }
}
