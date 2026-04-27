/**
 * Utility для генерації та валідації slugs
 */
export class SlugUtil {
  /**
   * Генерує URL-friendly slug з тексту
   * @param text - Вхідний текст
   * @param addRandom - Чи додавати random suffix для унікальності
   * @returns Згенерований slug
   */
  static generate(text: string, addRandom: boolean = true): string {
    let slug = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Видаляємо спецсимволи
      .replace(/\s+/g, '-') // Пробіли в дефіси
      .replace(/-+/g, '-') // Множинні дефіси в один
      .replace(/^-|-$/g, ''); // Видаляємо дефіси на початку/кінці

    if (addRandom) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      slug = slug ? `${slug}-${randomSuffix}` : randomSuffix;
    }

    return slug;
  }

  /**
   * Валідує slug формат
   * @param slug - Slug для валідації
   * @returns true якщо slug валідний
   */
  static isValid(slug: string): boolean {
    // Slug має містити тільки lowercase літери, цифри та дефіси
    // Не може починатися або закінчуватися дефісом
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }
}
