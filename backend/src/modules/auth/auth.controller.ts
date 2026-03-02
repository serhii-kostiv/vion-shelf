import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express'; // Імпорт типу з express
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.quard';
import type { User } from '@prisma/client';
interface RequestWithUser extends ExpressRequest {
  user: User;
}

interface RequestWithCookies extends ExpressRequest {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  async login(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const loginResult = this.authService.login(req.user);

    const refreshToken = await this.authService.createRefreshToken(
      req.user,
      req.headers['user-agent'],
      req.ip,
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
    });

    return loginResult;
  }

  @Post('logout')
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['refresh_token'];
    if (token) {
      await this.authService.revokeRefreshToken(token);
    }

    res.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken = req.cookies?.['refresh_token'];
    if (!oldToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const { accessToken, refreshToken, user } =
      await this.authService.refreshSession(
        oldToken,
        req.headers['user-agent'],
        req.ip,
      );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
    });

    return {
      access_token: accessToken,
      user,
    };
  }
}
