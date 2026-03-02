import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import type { User as PrismaUser } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { JWTGuard } from '@/modules/auth/guards/jwt.quard';
import { UserProfileDto } from './dto/user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JWTGuard)
  async getProfile(@User() user: PrismaUser): Promise<UserProfileDto | null> {
    return await this.usersService.getProfileByEmail(user.email);
  }
}
