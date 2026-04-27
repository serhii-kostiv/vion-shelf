import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { UserProfileDto } from './dto/user-profile.dto';
import { AppLoggerService } from '@/core/logging/logger.service';
import {
  PaginationUtil,
  PaginatedResult,
  PaginationParams,
} from '@/common/utils/pagination.util';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * Service для управління користувачами
 */
@Injectable()
export class UsersService {
  private readonly logger: AppLoggerService;

  constructor(private readonly prismaService: PrismaService) {
    this.logger = new AppLoggerService(UsersService.name);
  }

  /**
   * Знаходить користувача за email
   * @param email - Email користувача
   * @returns User або null якщо не знайдено
   */
  async findOne(email: string): Promise<User | null> {
    // Basic validation - return null for invalid input to support auth flows
    if (!email || typeof email !== 'string' || email.trim() === '') {
      this.logger.warn('Invalid email provided to findOne', { email });
      return null;
    }

    try {
      const user = await this.prismaService.user.findUnique({
        where: { email: email.trim() },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          name: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          // Exclude refreshTokens and collections
        },
      });

      if (user) {
        this.logger.log('User found by email', { userId: user.id });
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Отримує профіль користувача за email або викидає NotFoundException
   * @param email - Email користувача
   * @returns UserProfileDto
   * @throws NotFoundException якщо користувача не знайдено
   * @throws BadRequestException якщо email невалідний
   */
  async getProfileByEmail(email: string): Promise<UserProfileDto> {
    // Business rule validation before database operations
    if (!email || typeof email !== 'string' || email.trim() === '') {
      this.logger.warn('Invalid email provided to getProfileByEmail', {
        email,
      });
      throw new BadRequestException('Valid email is required');
    }

    try {
      // Using findUniqueOrThrow pattern
      const user = await this.prismaService.findUniqueOrThrow<UserProfileDto>(
        Prisma.ModelName.User,
        {
          where: { email: email.trim() },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        'User not found',
      );

      this.logger.log('User profile retrieved successfully', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error('Failed to get user profile', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Знаходить користувача за ID або викидає NotFoundException
   * @param id - ID користувача
   * @returns User
   * @throws NotFoundException якщо користувача не знайдено
   * @throws BadRequestException якщо ID невалідний
   */
  async findById(id: string): Promise<User> {
    // Business rule validation before database operations
    if (!id || typeof id !== 'string' || id.trim() === '') {
      this.logger.warn('Invalid user ID provided to findById', { id });
      throw new BadRequestException('Valid user ID is required');
    }

    try {
      // Using findUniqueOrThrow pattern with field selection
      const user = await this.prismaService.findUniqueOrThrow<User>(
        Prisma.ModelName.User,
        {
          where: { id: id.trim() },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            // Exclude refreshTokens and collections
          },
        },
        `User with ID ${id} not found`,
      );

      this.logger.log('User found by ID', { userId: user.id });

      return user;
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error('Failed to find user by ID', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Знаходить користувача за username або викидає NotFoundException
   * @param username - Username користувача
   * @returns User
   * @throws NotFoundException якщо користувача не знайдено
   * @throws BadRequestException якщо username невалідний
   */
  async findByUsername(username: string): Promise<User> {
    // Business rule validation before database operations
    if (!username || typeof username !== 'string' || username.trim() === '') {
      this.logger.warn('Invalid username provided to findByUsername', {
        username,
      });
      throw new BadRequestException('Valid username is required');
    }

    try {
      // Using findUniqueOrThrow pattern with field selection
      const user = await this.prismaService.findUniqueOrThrow<User>(
        Prisma.ModelName.User,
        {
          where: { username: username.trim() },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            name: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            // Exclude refreshTokens and collections
          },
        },
        `User with username ${username} not found`,
      );

      this.logger.log('User found by username', { userId: user.id });

      return user;
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error('Failed to find user by username', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Отримує список всіх користувачів з пагінацією
   * @param params - Параметри пагінації (page, limit)
   * @returns Пагінований список користувачів
   */
  async findAll(
    params: PaginationParams,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const { page, limit } = params;
    const skip = PaginationUtil.calculateSkip(page, limit);

    try {
      // Parallel execution of count and findMany for better performance
      const [users, total] = await Promise.all([
        this.prismaService.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            // Exclude password and refreshTokens
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prismaService.user.count(),
      ]);

      this.logger.log('Users list retrieved successfully', {
        page,
        limit,
        total,
        returned: users.length,
      });

      // Map null to undefined for avatarUrl to match UserResponseDto type
      const mappedUsers = users.map((user) => ({
        ...user,
        avatarUrl: user.avatarUrl ?? undefined,
      }));

      return PaginationUtil.createResult(mappedUsers, page, limit, total);
    } catch (error) {
      this.logger.error('Failed to retrieve users list', {
        page,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
