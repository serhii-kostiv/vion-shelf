/**
 * Параметри пагінації
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Metadata для пагінованого результату
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Пагінований результат
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Utility для роботи з pagination
 */
export class PaginationUtil {
  /**
   * Обчислює skip для Prisma query
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Створює pagination metadata
   */
  static createMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Створює пагінований результат
   */
  static createResult<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResult<T> {
    return {
      data,
      meta: this.createMeta(page, limit, total),
    };
  }
}
