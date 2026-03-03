import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Protects endpoints requiring authentication using JWT tokens.
 * Supports @Public() decorator to bypass authentication for specific endpoints.
 *
 * @example
 * ```typescript
 * // Protected endpoint (requires JWT)
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * // Public endpoint (no JWT required)
 * @Public()
 * @Get('public')
 * getPublicData() {
 *   return { message: 'Public data' };
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the request can proceed
   *
   * @param context - Execution context containing request information
   * @returns true if request is allowed (public endpoint or valid JWT), false otherwise
   */
  canActivate(context: ExecutionContext) {
    // Check if endpoint is marked as public using @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Allow access to public endpoints without authentication
    if (isPublic) {
      return true;
    }

    // For protected endpoints, delegate to Passport JWT strategy
    return super.canActivate(context);
  }
}
