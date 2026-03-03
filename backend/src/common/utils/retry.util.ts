/**
 * Опції для retry logic
 */
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff: boolean;
}

/**
 * Utility для retry logic з exponential backoff
 */
export class RetryUtil {
  /**
   * Виконує функцію з retry logic
   * @param fn - Функція для виконання
   * @param options - Опції retry
   * @returns Результат функції
   * @throws Остання помилка якщо всі спроби failed
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true,
    },
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Якщо це остання спроба - викидаємо помилку
        if (attempt === options.maxAttempts) {
          break;
        }

        // Обчислюємо delay з exponential backoff
        const delay = options.exponentialBackoff
          ? options.delayMs * Math.pow(2, attempt - 1)
          : options.delayMs;

        // Чекаємо перед наступною спробою
        await this.sleep(delay);
      }
    }

    // Викидаємо останню помилку (або fallback якщо щось пішло не так)
    throw lastError ?? new Error('Retry failed with unknown error');
  }

  /**
   * Helper для затримки
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
