import { PrismaService } from '@/core/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '@/modules/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  login(user: User): { access_token: string } {
    const payload = { id: user.id, name: user.name, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  generateAccessToken(user: User): string {
    const payload = { id: user.id, name: user.name, email: user.email };
    return this.jwtService.sign(payload);
  }

  private parseDurationToMs(value: string): number {
    const trimmed = value.trim();
    const match = /^(\d+)([smhd])?$/.exec(trimmed);
    if (!match) {
      // fallback 7 days
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2] ?? 'ms';

    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return amount;
    }
  }

  private getRefreshTokenExpiresAt(): Date {
    const raw =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const ms = this.parseDurationToMs(raw);
    return new Date(Date.now() + ms);
  }

  async createRefreshToken(
    user: User,
    userAgent?: string,
    ip?: string,
  ): Promise<string> {
    // Створюємо випадкове значення refresh-токена
    const rawToken = randomUUID();
    // Хеш зберігаємо в БД, а не саме значення
    const tokenHash = await argon2.hash(rawToken);
    const expiresAt = this.getRefreshTokenExpiresAt();

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const prisma = this.prismaService as any;
    const created = (await prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        userAgent,
        ip,
        expiresAt,
      },
    })) as { id: string };
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    // У cookie віддаємо комбінацію id + rawToken (id для швидкого пошуку, rawToken для перевірки хешу)
    return `${created.id}.${rawToken}`;
  }

  async refreshSession(
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    // Очікуємо формат "<id>.<rawToken>"
    const [id, rawToken] = refreshToken.split('.');
    if (!id || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const prisma = this.prismaService as any;
    const existing = await prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await argon2.verify(existing.token as string, rawToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // revoke old token
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const user = existing.user as User;
    const newRefreshToken = await this.createRefreshToken(user, userAgent, ip);
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const [id] = token.split('.');
    if (!id) {
      return;
    }

    const prisma = this.prismaService as any;
    await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
