import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Guard - додає user до request якщо токен валідний,
 * але не блокує запит якщо токена немає або він невалідний
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Завжди повертає true - не блокує запит
   */
  canActivate(context: ExecutionContext) {
    // Викликаємо parent canActivate, але ігноруємо результат
    return super.canActivate(context);
  }

  /**
   * Обробляємо помилки - просто ігноруємо їх
   */
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    // Якщо є user - повертаємо його
    // Якщо немає або є помилка - повертаємо undefined
    // Не викидаємо exception
    return user || undefined;
  }
}
