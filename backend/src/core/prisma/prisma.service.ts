import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter, log: [{ emit: 'event', level: 'query' }] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected successfully');

    // Logging middleware для slow queries
    this.$on('query' as never, (e: QueryEvent) => {
      if (e.duration > 1000) {
        this.logger.warn(`Slow query detected: ${e.duration}ms`, {
          query: e.query,
          params: e.params,
        });
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected gracefully');
  }

  /**
   * Helper для "find or fail" pattern
   * Знаходить запис або викидає NotFoundException
   * @param model - Назва моделі Prisma
   * @param args - Аргументи для findUnique
   * @param errorMessage - Кастомне повідомлення про помилку
   * @returns Знайдений запис
   * @throws NotFoundException якщо запис не знайдено
   */
  async findUniqueOrThrow<T>(
    model: Prisma.ModelName,
    args: unknown,
    errorMessage?: string,
  ): Promise<T> {
    const delegate = this[model as keyof PrismaClient] as {
      findUnique: (args: unknown) => Promise<T | null>;
    };

    const result = await delegate.findUnique(args);

    if (!result) {
      throw new NotFoundException(errorMessage || `${model} not found`);
    }

    return result;
  }
}
