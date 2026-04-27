import 'dotenv/config';
import { PrismaClient, Category, ItemStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const demoPassword = 'changeme';
  const demoPasswordHash = await argon2.hash(demoPassword);

  // Базовий користувач
  const user = await prisma.user.upsert({
    where: { email: 'demo@vionshelf.app' },
    update: {
      password: demoPasswordHash,
    },
    create: {
      username: 'demo',
      name: 'Demo User',
      email: 'demo@vionshelf.app',
      password: demoPasswordHash,
      avatarUrl: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
      bio: 'Demo user for local development.',
    },
  });

  // Кілька базових медіа-айтемів
  const mediaBook = await prisma.mediaItem.upsert({
    where: { externalId: 'book-demo-1' },
    update: {},
    create: {
      externalId: 'book-demo-1',
      type: Category.BOOKS,
      title: 'Clean Code',
      posterUrl: null,
      metadata: {
        authors: ['Robert C. Martin'],
        year: 2008,
        genres: ['Programming', 'Software Engineering'],
      },
    },
  });

  const mediaMovie = await prisma.mediaItem.upsert({
    where: { externalId: 'movie-demo-1' },
    update: {},
    create: {
      externalId: 'movie-demo-1',
      type: Category.MOVIES,
      title: 'Inception',
      posterUrl: null,
      metadata: {
        director: 'Christopher Nolan',
        year: 2010,
        genres: ['Sci-Fi', 'Thriller'],
      },
    },
  });

  // Базова колекція користувача
  const collection = await prisma.collection.upsert({
    where: { slug: 'demo-collection' },
    update: {},
    create: {
      title: 'Demo Collection',
      description: 'Example collection created by seed.',
      slug: 'demo-collection',
      category: Category.MIXED,
      isPublic: true,
      userId: user.id,
    },
  });

  // Елементи колекції
  await prisma.collectionItem.createMany({
    data: [
      {
        collectionId: collection.id,
        mediaItemId: mediaBook.id,
        status: ItemStatus.IN_PROGRESS,
        rating: 9,
        progress: 120,
        notes: 'Re-reading favorite chapters.',
      },
      {
        collectionId: collection.id,
        mediaItemId: mediaMovie.id,
        status: ItemStatus.PLANNED,
        rating: null,
        progress: 0,
        notes: 'Watch on the weekend.',
      },
    ],
    skipDuplicates: true,
  });

  // Лайк і коментар до колекції
  await prisma.like.upsert({
    where: {
      userId_collectionId: {
        userId: user.id,
        collectionId: collection.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      collectionId: collection.id,
    },
  });

  await prisma.comment.create({
    data: {
      userId: user.id,
      collectionId: collection.id,
      text: 'This is a demo comment on the demo collection.',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
