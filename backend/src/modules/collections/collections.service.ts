import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemStatus, Prisma } from '@prisma/client';
import { SlugUtil } from '@/common/utils/slug.util';
import {
  PaginationUtil,
  PaginatedResult,
  PaginationParams,
} from '@/common/utils/pagination.util';
import { AppLoggerService } from '@/core/logging/logger.service';

@Injectable()
export class CollectionsService {
  private readonly logger = new AppLoggerService(CollectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkSlugAvailability(
    slug: string,
    excludeId?: string,
  ): Promise<{ available: boolean }> {
    const existing = await this.prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    const available = !existing || existing.id === excludeId;
    return { available };
  }

  // Створення колекції
  async createCollection(userId: string, dto: CreateCollectionDto) {
    const slug = dto.slug ?? SlugUtil.generate(dto.title);

    if (dto.slug) {
      const existing = await this.prisma.collection.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Slug вже зайнятий');
      }
    }

    const collection = await this.prisma.collection.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug: slug,
        category: dto.category,
        isPublic: dto.isPublic ?? false,
        userId: userId,
      },
    });

    this.logger.log('Collection created', {
      userId,
      collectionId: collection.id,
      title: collection.title,
      category: collection.category,
      isPublic: collection.isPublic,
    });

    return collection;
  }

  // Отримати всі колекції користувача з пагінацією
  async getUserCollections(
    userId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = paginationParams;
    const skip = PaginationUtil.calculateSkip(page, limit);

    // Паралельні запити для даних та підрахунку
    const [collections, total] = await Promise.all([
      this.prisma.collection.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          category: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { items: true }, // Кількість елементів
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.collection.count({
        where: { userId },
      }),
    ]);

    // Трансформуємо результат для додавання itemsCount
    const collectionsWithCount = collections.map((collection) => ({
      ...collection,
      itemsCount: collection._count.items,
      _count: undefined, // Видаляємо _count з відповіді
    }));

    return PaginationUtil.createResult(
      collectionsWithCount,
      page,
      limit,
      total,
    );
  }

  // Отримати колекцію за slug з усіма елементами
  async getCollectionBySlug(slug: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        items: {
          select: {
            id: true,
            status: true,
            rating: true,
            progress: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            mediaItem: {
              select: {
                id: true,
                externalId: true,
                type: true,
                title: true,
                posterUrl: true,
                metadata: true,
                // НЕ включаємо items (зворотній зв'язок)
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Додаємо itemsCount до відповіді
    return {
      ...collection,
      itemsCount: collection._count.items,
      _count: undefined, // Видаляємо _count з відповіді
    };
  }

  /**
   * Update collection
   * Ownership verification is handled by CollectionOwnershipGuard
   */
  async updateCollection(collectionId: string, dto: UpdateCollectionDto) {
    // Якщо передано новий slug — перевіряємо унікальність
    if (dto.slug) {
      const existing: { id: string } | null =
        await this.prisma.collection.findUnique({
          where: { slug: dto.slug },
          select: { id: true },
        });
      if (existing && existing.id !== collectionId) {
        throw new ConflictException('Slug вже зайнятий');
      }
    }

    const collection: {
      id: string;
      title: string;
      description: string | null;
      slug: string;
      category: string;
      isPublic: boolean;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      _count: { items: number };
    } = await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        isPublic: dto.isPublic,
        ...(dto.slug ? { slug: dto.slug } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: {
          select: { items: true },
        },
      },
    });

    this.logger.log('Collection updated', {
      userId: collection.userId,
      collectionId: collection.id,
      title: collection.title,
      slug: collection.slug,
      category: collection.category,
      isPublic: collection.isPublic,
    });

    return collection;
  }

  async deleteCollection(collectionId: string) {
    await this.prisma.collection.delete({ where: { id: collectionId } });
    this.logger.log('Collection deleted', { collectionId });
  }

  /**
   * Add item to collection (Upsert Pattern)
   * Ownership verification is handled by CollectionOwnershipGuard
   */
  async addItemToCollection(collectionId: string, dto: AddItemDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // КРОК 1: Upsert MediaItem (знайти або створити)
        const mediaItem = await tx.mediaItem.upsert({
          where: { externalId: dto.mediaItem.externalId },
          create: {
            externalId: dto.mediaItem.externalId,
            type: dto.mediaItem.type,
            title: dto.mediaItem.title,
            posterUrl: dto.mediaItem.posterUrl,
            metadata: dto.mediaItem.metadata ?? {},
          },
          update: {}, // Не оновлюємо якщо вже існує
        });

        // КРОК 2: Перевірка дублікату
        const existing = await tx.collectionItem.findUnique({
          where: {
            collectionId_mediaItemId: {
              collectionId,
              mediaItemId: mediaItem.id,
            },
          },
        });

        if (existing) {
          throw new ConflictException('Item already in this collection');
        }

        // КРОК 3: Створення CollectionItem (персональний запис)
        const collectionItem = await tx.collectionItem.create({
          data: {
            collectionId,
            mediaItemId: mediaItem.id,
            status: dto.collectionItem?.status ?? ItemStatus.PLANNED,
            rating: dto.collectionItem?.rating,
            progress: dto.collectionItem?.progress ?? 0,
            notes: dto.collectionItem?.notes,
          },
          include: {
            mediaItem: true, // Повертаємо з повною інфою
            collection: {
              select: {
                userId: true,
              },
            },
          },
        });

        return collectionItem;
      },
      {
        maxWait: 5000, // Максимальний час очікування транзакції (5 секунд)
        timeout: 10000, // Timeout транзакції (10 секунд)
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Рівень ізоляції для запобігання dirty reads
      },
    );

    this.logger.log('Item added to collection', {
      userId: result.collection.userId,
      collectionId,
      itemId: result.id,
      mediaItemId: result.mediaItemId,
      mediaTitle: result.mediaItem.title,
      status: result.status,
    });

    return result;
  }

  /**
   * Update collection item
   * Ownership verification is handled by CollectionOwnershipGuard
   */
  async updateItem(itemId: string, dto: UpdateItemDto) {
    const { status, rating, progress, notes, title, posterUrl, metadata } = dto;

    const item = await this.prisma.$transaction(async (tx) => {
      // Оновлюємо mediaItem якщо є відповідні поля
      if (
        title !== undefined ||
        posterUrl !== undefined ||
        metadata !== undefined
      ) {
        const collectionItem = await tx.collectionItem.findUnique({
          where: { id: itemId },
          select: { mediaItemId: true },
        });

        if (collectionItem) {
          await tx.mediaItem.update({
            where: { id: collectionItem.mediaItemId },
            data: {
              ...(title !== undefined && { title }),
              ...(posterUrl !== undefined && { posterUrl: posterUrl || null }),
              ...(metadata !== undefined && { metadata }),
            },
          });
        }
      }

      return tx.collectionItem.update({
        where: { id: itemId },
        data: { status, rating, progress, notes },
        select: {
          id: true,
          status: true,
          rating: true,
          progress: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          collectionId: true,
          collection: {
            select: { userId: true },
          },
          mediaItem: {
            select: {
              id: true,
              externalId: true,
              type: true,
              title: true,
              posterUrl: true,
              metadata: true,
            },
          },
        },
      });
    });

    this.logger.log('Collection item updated', {
      userId: item.collection.userId,
      collectionId: item.collectionId,
      itemId: item.id,
      mediaTitle: item.mediaItem.title,
      status: item.status,
      rating: item.rating,
      progress: item.progress,
    });

    return item;
  }
  async getItem(itemId: string) {
    const item = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        status: true,
        rating: true,
        progress: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        collectionId: true,
        collection: {
          select: {
            title: true,
            slug: true,
          },
        },
        mediaItem: {
          select: {
            id: true,
            externalId: true,
            type: true,
            title: true,
            posterUrl: true,
            metadata: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Collection item not found');
    }

    return item;
  }

  /**
   * Remove item from collection
   * Ownership verification is handled by CollectionOwnershipGuard
   * @returns void (204 No Content will be returned by controller)
   */
  async removeItem(itemId: string) {
    // Fetch item details before deletion for logging
    const item = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        collectionId: true,
        collection: {
          select: {
            userId: true,
          },
        },
        mediaItem: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Collection item not found');
    }

    await this.prisma.collectionItem.delete({
      where: { id: itemId },
    });

    this.logger.log('Item removed from collection', {
      userId: item.collection.userId,
      collectionId: item.collectionId,
      itemId: item.id,
      mediaTitle: item.mediaItem.title,
    });

    // Повертаємо void (204 No Content буде в контролері)
    return;
  }

  // Отримати всі MediaItem (глобальний каталог) з пагінацією
  async getAllMedia(
    paginationParams: PaginationParams,
  ): Promise<PaginatedResult<any>> {
    const { page, limit } = paginationParams;
    const skip = PaginationUtil.calculateSkip(page, limit);

    // Паралельні запити для даних та підрахунку
    const [mediaItems, total] = await Promise.all([
      this.prisma.mediaItem.findMany({
        select: {
          id: true,
          externalId: true,
          type: true,
          title: true,
          posterUrl: true,
          metadata: true,
          _count: {
            select: { items: true }, // Скільки разів додано
          },
        },
        orderBy: { title: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.mediaItem.count(),
    ]);

    return PaginationUtil.createResult(mediaItems, page, limit, total);
  }
}
