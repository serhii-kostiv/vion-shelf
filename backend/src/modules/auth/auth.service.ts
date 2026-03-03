import { PrismaService } from '@/core/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);

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

  /**
   * Registers a new user
   * @param dto - User registration data
   * @returns Created user
   * @throws ConflictException if username or email already exists
   */
  async register(dto: RegisterDto): Promise<User> {
    // Business rule validation BEFORE database operations
    await this.validateUserUniqueness(dto.username, dto.email);

    // Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // Create user (use username as name if name is not provided)
    const user = await this.prismaService.user.create({
      data: {
        username: dto.username,
        name: dto.name ?? dto.username,
        email: dto.email,
        password: passwordHash,
      },
    });

    this.logger.log('User registered successfully', {
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return user;
  }

  /**
   * Validates that username and email are unique
   * @param username - Username to check
   * @param email - Email to check
   * @throws ConflictException if username or email already exists
   */
  private async validateUserUniqueness(
    username: string,
    email: string,
  ): Promise<void> {
    const usernameExists = await this.prismaService.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (usernameExists) {
      throw new ConflictException('Username already exists');
    }

    const emailExists = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Validates user credentials
   * @param email - User email
   * @param password - User password
   * @returns User if credentials are valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findOne(email);
      if (!user) {
        this.logger.warn('Login attempt with non-existent email', { email });
        return null;
      }

      const isPasswordValid = await this.verifyPassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn('Login attempt with invalid password', {
          userId: user.id,
          email: user.email,
        });
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Error validating user credentials', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Generates login response with access token
   * @param user - Authenticated user
   * @returns Object containing access token
   */
  login(user: User): { access_token: string } {
    const payload = { id: user.id, name: user.name, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      access_token: accessToken,
    };
  }

  /**
   * Generates access token for user
   * @param user - User to generate token for
   * @returns JWT access token
   */
  generateAccessToken(user: User): string {
    const payload = { id: user.id, name: user.name, email: user.email };
    return this.jwtService.sign(payload);
  }

  /**
   * Parses duration string to milliseconds
   * @param value - Duration string (e.g., "7d", "24h", "60m")
   * @returns Duration in milliseconds
   */
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

  /**
   * Calculates refresh token expiration date
   * @returns Expiration date
   */
  private getRefreshTokenExpiresAt(): Date {
    const raw =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const ms = this.parseDurationToMs(raw);
    return new Date(Date.now() + ms);
  }

  /**
   * Creates a new refresh token for user
   * @param user - User to create token for
   * @param userAgent - Optional user agent string
   * @param ip - Optional IP address
   * @returns Refresh token string in format "id.rawToken"
   */
  async createRefreshToken(
    user: User,
    userAgent?: string,
    ip?: string,
  ): Promise<string> {
    // Generate random token value
    const rawToken = randomUUID();

    // Hash token before storing in database
    const tokenHash = await argon2.hash(rawToken);
    const expiresAt = this.getRefreshTokenExpiresAt();

    // Create refresh token in database
    const created = await this.prismaService.refreshToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        userAgent,
        ip,
        expiresAt,
      },
      select: {
        id: true,
      },
    });

    this.logger.log('Refresh token created', {
      userId: user.id,
      tokenId: created.id,
    });

    // Return combination of id + rawToken (id for quick lookup, rawToken for hash verification)
    return `${created.id}.${rawToken}`;
  }

  /**
   * Refreshes user session with token rotation
   * Validates token, revokes old token, and issues new token pair
   * @param refreshToken - Refresh token in format "id.rawToken"
   * @param userAgent - Optional user agent string
   * @param ip - Optional IP address
   * @returns New access token, refresh token, and user data
   * @throws UnauthorizedException if token is invalid, expired, or revoked
   */
  async refreshSession(
    refreshToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    // Parse token format "<id>.<rawToken>"
    const [id, rawToken] = refreshToken.split('.');

    // Business rule validation BEFORE database operations
    if (!id || !rawToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    // Fetch token from database
    const existing = await this.prismaService.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });

    // Validate token exists
    if (!existing) {
      this.logger.warn('Refresh attempt with non-existent token', {
        tokenId: id,
      });
      throw new UnauthorizedException('Refresh token not found');
    }

    // Validate token is not revoked
    if (existing.revokedAt) {
      this.logger.warn('Attempt to use revoked token', {
        tokenId: id,
        userId: existing.userId,
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Validate token expiration
    if (existing.expiresAt < new Date()) {
      this.logger.warn('Attempt to use expired token', {
        tokenId: id,
        userId: existing.userId,
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify token hash
    const isValid = await argon2.verify(existing.token, rawToken);
    if (!isValid) {
      this.logger.warn('Invalid token hash', {
        tokenId: id,
        userId: existing.userId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token rotation: Revoke old token
    await this.prismaService.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair
    const user = existing.user;
    const newRefreshToken = await this.createRefreshToken(user, userAgent, ip);
    const accessToken = this.generateAccessToken(user);

    this.logger.log('Session refreshed successfully', {
      userId: user.id,
      oldTokenId: existing.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  /**
   * Revokes a refresh token
   * @param token - Refresh token in format "id.rawToken"
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const [id] = token.split('.');
    if (!id) {
      this.logger.warn('Attempted to revoke token with invalid format');
      return;
    }

    // Get token info before revoking for logging
    const tokenInfo = await this.prismaService.refreshToken.findUnique({
      where: { id },
      select: { userId: true, revokedAt: true },
    });

    const result = await this.prismaService.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count > 0 && tokenInfo) {
      this.logger.log('Refresh token revoked', {
        tokenId: id,
        userId: tokenInfo.userId,
      });
    }
  }

  /**
   * Cleans up expired and revoked refresh tokens from the database
   * Removes tokens that are either expired or revoked and older than specified days
   * @param olderThanDays - Number of days to keep revoked tokens (default: 30)
   * @returns Number of tokens deleted
   */
  async cleanupExpiredTokens(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const now = new Date();

    // Delete tokens that are:
    // 1. Expired (expiresAt < now), OR
    // 2. Revoked and older than cutoff date (revokedAt < cutoffDate)
    const result = await this.prismaService.refreshToken.deleteMany({
      where: {
        OR: [
          {
            // Expired tokens
            expiresAt: {
              lt: now,
            },
          },
          {
            // Revoked tokens older than cutoff
            revokedAt: {
              not: null,
              lt: cutoffDate,
            },
          },
        ],
      },
    });

    this.logger.log('Token cleanup completed', {
      tokensRemoved: result.count,
      olderThanDays,
    });

    return result.count;
  }
}
