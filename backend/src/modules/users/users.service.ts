import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  async findOne(email: string): Promise<User | undefined | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    return user;
  }
}
