import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  async findOne(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    return user;
  }

  async getProfileByEmail(email: string): Promise<UserProfileDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
