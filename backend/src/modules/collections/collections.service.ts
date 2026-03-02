import { PrismaService } from '@/core/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ItemStatus } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Створення колекції
  async createCollection(userId: string, dto: CreateCollectionDto) {
    // Генеруємо slug з назви + random string
    const randomString = Math.random().toString(36).substring(2, 8);
    const slug = `${dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${randomString}`;

    return await this.prisma.collection.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug: slug,
        category: dto.category,
        isPublic: dto.isPublic ?? false,
        userId: userId,
      },
    });
  }

  // Отримати всі колекції користувача
  async getUserCollections(userId: string) {
    return await this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true }, // Кількість елементів
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Отримати колекцію за slug з усіма елементами
  async getCollectionBySlug(slug: string) {
    return await this.prisma.collection.findUnique({
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
      },
    });
  }

  // Додати елемент до колекції (Upsert Pattern)
  async addItemToCollection(
    userId: string,
    collectionId: string,
    dto: AddItemDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // КРОК 1: Перевірка власності колекції
      const collection = await tx.collection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new NotFoundException('Collection not found');
      }

      if (collection.userId !== userId) {
        throw new ForbiddenException('You do not own this collection');
      }

      // КРОК 2: Upsert MediaItem (знайти або створити)
      const mediaItem = await tx.mediaItem.upsert({
        where: { externalId: dto.externalId },
        create: {
          externalId: dto.externalId,
          type: dto.type,
          title: dto.title,
          posterUrl: dto.posterUrl,
          metadata: dto.metadata ?? {},
        },
        update: {}, // Не оновлюємо якщо вже існує
      });

      // КРОК 3: Перевірка дублікату
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

      // КРОК 4: Створення CollectionItem (персональний запис)
      const collectionItem = await tx.collectionItem.create({
        data: {
          collectionId,
          mediaItemId: mediaItem.id,
          status: dto.status ?? ItemStatus.PLANNED,
          rating: dto.rating,
          progress: dto.progress ?? 0,
          notes: dto.notes,
        },
        include: {
          mediaItem: true, // Повертаємо з повною інфою
        },
      });

      return collectionItem;
    });
  }

  // Оновити прогрес елемента
  async updateItem(itemId: string, dto: Partial<AddItemDto>) {
    // Спочатку перевіряємо чи існує елемент
    const existingItem = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      throw new NotFoundException(`CollectionItem with id ${itemId} not found`);
    }

    return await this.prisma.collectionItem.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        rating: dto.rating,
        progress: dto.progress,
        notes: dto.notes,
      },
      include: {
        mediaItem: true,
      },
    });
  }

  // Видалити елемент з колекції
  async removeItem(itemId: string) {
    // Спочатку перевіряємо чи існує елемент
    const existingItem = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      throw new NotFoundException(`CollectionItem with id ${itemId} not found`);
    }

    return await this.prisma.collectionItem.delete({
      where: { id: itemId },
    });
  }

  // Отримати всі MediaItem (глобальний каталог)
  async getAllMedia() {
    return await this.prisma.mediaItem.findMany({
      include: {
        _count: {
          select: { items: true }, // Скільки разів додано
        },
      },
      orderBy: { title: 'desc' },
    });
  }
}
