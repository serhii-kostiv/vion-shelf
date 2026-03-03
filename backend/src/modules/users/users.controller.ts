import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { User as PrismaUser } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { JWTGuard } from '@/modules/auth/guards/jwt.quard';
import { UserProfileDto } from './dto/user-profile.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResult } from '@/common/utils/pagination.util';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * Controller для управління користувачами
 * Thin HTTP layer - делегує всю бізнес-логіку до UsersService
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Отримує список всіх користувачів з пагінацією
   * @param paginationQuery - Параметри пагінації
   * @returns Пагінований список користувачів
   */
  @Get()
  @UseGuards(JWTGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const params = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };
    return await this.usersService.findAll(params);
  }

  /**
   * Отримує профіль поточного користувача
   * @param user - Поточний автентифікований користувач
   * @returns Профіль користувача
   */
  @Get('profile')
  @UseGuards(JWTGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@User() user: PrismaUser): Promise<UserProfileDto> {
    return await this.usersService.getProfileByEmail(user.email);
  }
}
