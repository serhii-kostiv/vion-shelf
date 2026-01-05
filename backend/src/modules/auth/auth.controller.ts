import {
  Body,
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express'; // Імпорт типу з express
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.quard';
import type { User } from '@prisma/client';
import { JWTGuard } from './guards/jwt.quard';
interface RequestWithUser extends ExpressRequest {
  user: User;
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
  login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  logout() {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JWTGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser): User {
    return req.user;
  }
}
