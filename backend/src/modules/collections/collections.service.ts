import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';

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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        items: {
          include: {
            mediaItem: true, // Джойнимо глобальні дані
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Додати елемент до колекції (Upsert Pattern)
  async addItemToCollection(collectionId: string, dto: AddItemDto) {
    // КРОК 1: Шукаємо чи існує MediaItem
    let mediaItem = await this.prisma.mediaItem.findUnique({
      where: { externalId: dto.externalId },
    });

    // КРОК 2: Якщо немає - створюємо
    if (!mediaItem) {
      mediaItem = await this.prisma.mediaItem.create({
        data: {
          externalId: dto.externalId,
          type: dto.type,
          title: dto.title,
          posterUrl: dto.posterUrl,
          metadata: dto.metadata ?? {},
        },
      });
    }

    // КРОК 3: Створюємо CollectionItem (персональний запис)
    const collectionItem = await this.prisma.collectionItem.create({
      data: {
        collectionId: collectionId,
        mediaItemId: mediaItem.id,
        status: dto.status,
        rating: dto.rating,
        progress: dto.progress ?? 0,
        notes: dto.notes,
      },
      include: {
        mediaItem: true, // Повертаємо з повною інфою
      },
    });

    return collectionItem;
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
