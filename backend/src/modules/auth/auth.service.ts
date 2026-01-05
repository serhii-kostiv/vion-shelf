import { PrismaService } from '@/core/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '@/modules/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    // Хешування
    return await argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Перевірка (автоматично порівнює сіль)
    return await argon2.verify(hash, password);
  }

  async register(dto: RegisterDto) {
    const usernameExists = await this.prismaService.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (usernameExists) {
      throw new ConflictException('Username already exists');
    }

    const emailExists = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prismaService.user.create({
      data: {
        username: dto.username,
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      },
    });

    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOne(email);
    if (user) {
      const isPasswordValid = await this.verifyPassword(
        password,
        user.password,
      );
      if (isPasswordValid) {
        return user;
      }
    }
    return null;
  }

  login(user: User) {
    const payload = { id: user.id, name: user.name, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
