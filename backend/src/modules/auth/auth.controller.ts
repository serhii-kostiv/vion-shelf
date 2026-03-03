import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.quard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { User } from '@/common/decorators/user.decorator';
import type { User as UserEntity } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param dto - User registration data
   * @returns Created user (without sensitive data)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login with email and password
   * Uses LocalGuard which validates credentials via passport-local strategy
   * @param user - Authenticated user from LocalGuard
   * @param req - Request object for user agent and IP
   * @param res - Response object for setting cookies
   * @returns Access token and user data
   */
  @UseGuards(LocalGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @User() user: UserEntity,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(user);

    const refreshToken = await this.authService.createRefreshToken(
      user,
      req.headers['user-agent'],
      req.ip,
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return loginResult;
  }

  /**
   * Logout user by revoking refresh token
   * @param req - Request object for extracting refresh token from cookies
   * @param res - Response object for clearing cookies
   * @returns Success message
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token: unknown = req.cookies?.['refresh_token'];
    if (typeof token === 'string') {
      await this.authService.revokeRefreshToken(token);
    }

    res.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh access token using refresh token
   * Uses RefreshTokenGuard to validate token presence and format
   * @param req - Request object for extracting refresh token and metadata
   * @param res - Response object for setting new refresh token cookie
   * @returns New access token and user data
   */
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken: unknown = req.cookies?.['refresh_token'];

    const { accessToken, refreshToken, user } =
      await this.authService.refreshSession(
        oldToken as string,
        req.headers['user-agent'],
        req.ip,
      );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      access_token: accessToken,
      user,
    };
  }
}
