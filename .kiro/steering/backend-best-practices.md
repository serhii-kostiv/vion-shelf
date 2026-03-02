---
inclusion: fileMatch
fileMatchPattern: "backend/**/*.ts"
---

# Backend Best Practices (NestJS + Prisma)

## Архітектурні Принципи

### Модульна Структура

```
backend/src/modules/
  ├── auth/           # Автентифікація та авторизація
  ├── users/          # Управління користувачами
  ├── collections/    # Бізнес-логіка колекцій
  └── search/         # Пошук та інтеграції
```

Кожен модуль має:

- `*.module.ts` - визначення модуля та його залежностей
- `*.controller.ts` - HTTP endpoints (тонкий шар)
- `*.service.ts` - бізнес-логіка
- `dto/` - Data Transfer Objects для валідації
- `guards/` - захист endpoints (опціонально)
- `strategies/` - стратегії автентифікації (опціонально)

### Separation of Concerns

**Controller** - тільки HTTP:

- Приймає request
- Валідує через DTO
- Викликає service
- Повертає response
- НЕ містить бізнес-логіку

**Service** - бізнес-логіка:

- Обробка даних
- Виклики до БД через Prisma
- Бізнес-правила та валідація
- Обробка помилок

**DTO** - контракти API:

- Валідація вхідних даних (class-validator)
- Трансформація даних (class-transformer)
- Документація API (Swagger decorators)

## Обробка Помилок

### Використовуй Built-in Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";

// Приклад
if (!user) {
  throw new NotFoundException("User not found");
}
```

### Кастомні Exception Filters

Для специфічної обробки помилок (наприклад, Prisma errors):

```typescript
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    // Обробка специфічних Prisma помилок
  }
}
```

## Безпека

### Автентифікація

- JWT tokens для stateless auth
- Refresh tokens для довгострокових сесій
- HttpOnly cookies для зберігання токенів (захист від XSS)

### Авторизація

- Guards для захисту endpoints
- Декоратори для перевірки ролей/прав
- Перевіряй ownership ресурсів

### Валідація

- ЗАВЖДИ валідуй вхідні дані через DTO
- Використовуй ValidationPipe глобально
- Whitelist: true (видаляє невідомі поля)
- Transform: true (автоматична трансформація типів)

### SQL Injection

- Prisma автоматично захищає від SQL injection
- НЕ використовуй raw queries без параметризації
- Якщо потрібен raw query: `prisma.$queryRaw`

## Робота з Базою Даних (Prisma)

### Транзакції

Використовуй транзакції для атомарних операцій:

```typescript
await this.prisma.$transaction(async (tx) => {
  // Всі операції або виконаються, або відкатяться
  await tx.user.update(...);
  await tx.collection.create(...);
});
```

### Оптимізація Запитів

- Використовуй `select` для вибору тільки потрібних полів
- Використовуй `include` для eager loading зв'язків
- Уникай N+1 проблеми
- Додавай індекси для часто використовуваних полів

### Pagination

Завжди пагінуй списки:

```typescript
const items = await this.prisma.collection.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```

## Dependency Injection

### Constructor Injection

```typescript
@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}
}
```

### Уникай Circular Dependencies

- Використовуй forwardRef() тільки якщо неможливо уникнути
- Краще переглянути архітектуру модулів

## Performance

### Кешування

- Використовуй Redis для кешування частих запитів
- Cache-Aside pattern для даних, що рідко змінюються
- Invalidate cache при оновленні даних

### Async Operations

- Використовуй Bull Queue для фонових задач
- Email sending, file processing, тощо
- Не блокуй HTTP response

## Logging

### Structured Logging

```typescript
this.logger.log("User created", { userId: user.id });
this.logger.error("Failed to create user", { error: e.message });
```

### Рівні Логування

- `error` - помилки, які потребують уваги
- `warn` - потенційні проблеми
- `log` - важливі події
- `debug` - детальна інформація для розробки
- `verbose` - дуже детальна інформація

## Environment Variables

### Типізація

Створи `env.validation.ts` з Joi schema:

```typescript
export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  // ...
});
```

### Безпека

- НЕ комітуй .env файли
- Використовуй різні .env для dev/prod
- Зберігай секрети в secure vault (production)

## API Design

### RESTful Conventions

- GET /resources - список
- GET /resources/:id - один ресурс
- POST /resources - створення
- PATCH /resources/:id - часткове оновлення
- DELETE /resources/:id - видалення

### Response Format

Консистентний формат відповідей:

```typescript
{
  "data": { ... },
  "meta": { page, limit, total }
}
```

### HTTP Status Codes

- 200 OK - успішний GET/PATCH
- 201 Created - успішний POST
- 204 No Content - успішний DELETE
- 400 Bad Request - валідація не пройшла
- 401 Unauthorized - не автентифікований
- 403 Forbidden - не авторизований
- 404 Not Found - ресурс не знайдено
- 409 Conflict - конфлікт (наприклад, duplicate)
- 500 Internal Server Error - серверна помилка
