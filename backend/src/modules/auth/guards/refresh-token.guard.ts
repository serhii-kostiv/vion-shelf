import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Refresh Token Guard
 *
 * Validates that a refresh token is present and has the correct format.
 * Extracts refresh token from request body or cookies.
 * The actual token validation (expiration, revocation, hash verification)
 * is handled by AuthService.refreshSession method.
 *
 * @example
 * ```typescript
 * @UseGuards(RefreshTokenGuard)
 * @Post('refresh')
 * async refresh(@Req() req: Request) {
 *   const token = req.body.refreshToken || req.cookies?.['refresh_token'];
 *   return this.authService.refreshSession(token);
 * }
 * ```
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  /**
   * Validates refresh token presence and format
   *
   * @param context - Execution context containing request information
   * @returns true if refresh token is present and valid format
   * @throws UnauthorizedException if token is missing or invalid format
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract refresh token from body or cookies
    const body = request.body as Record<string, unknown> | undefined;
    const refreshToken: unknown =
      body?.refreshToken || request.cookies?.['refresh_token'];

    // Validate token presence
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Validate token format (should be "id.rawToken")
    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const parts = refreshToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new UnauthorizedException(
        'Invalid refresh token format. Expected format: id.rawToken',
      );
    }

    // Token is present and has valid format
    // Actual validation (expiration, revocation, hash) is done by AuthService
    return true;
  }
}
