---
inclusion: auto
---

# Code Quality Standards

## SOLID Principles

### Single Responsibility Principle (SRP)

Кожен клас/функція має одну відповідальність:

❌ **Погано:**

```typescript
class UserService {
  createUser() {
    /* ... */
  }
  sendEmail() {
    /* ... */
  } // Не відповідальність UserService
  generatePDF() {
    /* ... */
  } // Не відповідальність UserService
}
```

✅ **Добре:**

```typescript
class UserService {
  createUser() {
    /* ... */
  }
}

class EmailService {
  sendEmail() {
    /* ... */
  }
}

class PDFService {
  generatePDF() {
    /* ... */
  }
}
```

### Open/Closed Principle (OCP)

Відкритий для розширення, закритий для модифікації:

✅ **Добре:**

```typescript
// Базовий інтерфейс
interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

// Різні імплементації
class GoogleBooksProvider implements SearchProvider {
  async search(query: string) {
    /* ... */
  }
}

class OpenLibraryProvider implements SearchProvider {
  async search(query: string) {
    /* ... */
  }
}

// Сервіс працює з інтерфейсом
class SearchService {
  constructor(private provider: SearchProvider) {}

  async search(query: string) {
    return this.provider.search(query);
  }
}
```

### Liskov Substitution Principle (LSP)

Підкласи мають бути взаємозамінними з базовими класами.

### Interface Segregation Principle (ISP)

Не змушуй клієнтів залежати від методів, які вони не використовують.

### Dependency Inversion Principle (DIP)

Залежи від абстракцій, а не від конкретних реалізацій.

## DRY (Don't Repeat Yourself)

❌ **Погано:**

```typescript
// Дублювання логіки
async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException("User not found");
  return user;
}

async function getCollectionById(id: number) {
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) throw new NotFoundException("Collection not found");
  return collection;
}
```

✅ **Добре:**

```typescript
// Загальна функція
async function findOrFail<T>(
  model: any,
  id: number,
  entityName: string,
): Promise<T> {
  const entity = await model.findUnique({ where: { id } });
  if (!entity) {
    throw new NotFoundException(`${entityName} not found`);
  }
  return entity;
}

// Використання
const user = await findOrFail(prisma.user, id, "User");
const collection = await findOrFail(prisma.collection, id, "Collection");
```

## KISS (Keep It Simple, Stupid)

Пиши простий код. Складність додається тільки коли це необхідно.

❌ **Погано:**

```typescript
// Надмірна абстракція для простої задачі
class UserNameFormatterFactory {
  createFormatter(type: string): UserNameFormatter {
    // 50 рядків коду для простого форматування імені
  }
}
```

✅ **Добре:**

```typescript
// Проста функція
function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
```

## YAGNI (You Aren't Gonna Need It)

Не пиши код "на майбутнє". Пиши тільки те, що потрібно зараз.

❌ **Погано:**

```typescript
// Додаємо функціонал, який "можливо знадобиться"
class User {
  // ... 20 полів, які ніколи не використовуються
  futureFeature1?: string;
  futureFeature2?: number;
  // ...
}
```

## Чистий Код (Clean Code)

### Іменування

**Змінні та Функції:**

- Використовуй описові імена
- camelCase для змінних та функцій
- PascalCase для класів та типів
- UPPER_CASE для констант

❌ **Погано:**

```typescript
const d = new Date(); // Що таке 'd'?
const x = users.filter((u) => u.a); // Що таке 'a'?
```

✅ **Добре:**

```typescript
const currentDate = new Date();
const activeUsers = users.filter((user) => user.isActive);
```

**Функції:**

- Дієслова для дій: `getUser`, `createCollection`, `validateInput`
- Boolean функції: `isValid`, `hasPermission`, `canEdit`

### Функції

**Маленькі функції:**

- Одна функція = одна дія
- Максимум 20-30 рядків
- Якщо більше - розбий на менші функції

**Параметри:**

- Максимум 3-4 параметри
- Якщо більше - використовуй об'єкт

❌ **Погано:**

```typescript
function createUser(
  name: string,
  email: string,
  password: string,
  age: number,
  country: string,
  city: string,
) {
  /* ... */
}
```

✅ **Добре:**

```typescript
interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  age: number;
  country: string;
  city: string;
}

function createUser(data: CreateUserDto) {
  /* ... */
}
```

### Коментарі

**Коли писати коментарі:**

- Пояснення складної бізнес-логіки
- Пояснення "чому", а не "що"
- TODO коментарі для майбутніх завдань
- JSDoc для публічних API

**Коли НЕ писати коментарі:**

- Очевидні речі
- Замість рефакторингу поганого коду
- Застарілі коментарі (гірше ніж відсутність коментарів)

❌ **Погано:**

```typescript
// Перевіряємо чи користувач існує
const user = await prisma.user.findUnique({ where: { id } });
```

✅ **Добре:**

```typescript
// Код сам себе пояснює
const user = await findUserById(id);
```

✅ **Добре (складна логіка):**

```typescript
// Використовуємо exponential backoff для retry логіки,
// щоб не перевантажити зовнішній API при тимчасових збоях
const delay = Math.pow(2, attempt) * 1000;
```

## Error Handling

### Fail Fast

Перевіряй помилки якомога раніше:

✅ **Добре:**

```typescript
async function updateCollection(id: number, data: UpdateDto) {
  // Валідація на початку
  if (!data.title && !data.description) {
    throw new BadRequestException("Nothing to update");
  }

  const collection = await findCollectionOrFail(id);

  // Перевірка прав
  if (collection.userId !== currentUser.id) {
    throw new ForbiddenException("Not your collection");
  }

  // Основна логіка
  return await prisma.collection.update({
    where: { id },
    data,
  });
}
```

### Специфічні Помилки

Використовуй специфічні типи помилок:

❌ **Погано:**

```typescript
throw new Error("Something went wrong");
```

✅ **Добре:**

```typescript
throw new NotFoundException("Collection not found");
throw new UnauthorizedException("Invalid credentials");
throw new ForbiddenException("Access denied");
```

## TypeScript Best Practices

### Типізація

**Уникай `any`:**

```typescript
// ❌ Погано
const data: any = await fetchData();

// ✅ Добре
interface ApiResponse {
  data: User[];
  meta: { total: number };
}
const response: ApiResponse = await fetchData();
```

**Використовуй Union Types:**

```typescript
type Status = "pending" | "active" | "completed";
type Result = Success | Error;
```

**Використовуй Generics:**

```typescript
function findById<T>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}
```

### Null Safety

**Optional Chaining:**

```typescript
const userName = user?.profile?.name;
```

**Nullish Coalescing:**

```typescript
const displayName = user.name ?? "Anonymous";
```

**Type Guards:**

```typescript
function isUser(obj: any): obj is User {
  return obj && typeof obj.email === "string";
}

if (isUser(data)) {
  // TypeScript знає, що data це User
  console.log(data.email);
}
```

## Performance

### Уникай Передчасної Оптимізації

"Premature optimization is the root of all evil" - Donald Knuth

Спочатку пиши чистий код, потім оптимізуй якщо є проблеми.

### Коли Оптимізувати

- Коли є реальні проблеми з performance
- Коли є metrics, які показують bottleneck
- Коли оптимізація не погіршує читабельність

### Типові Оптимізації

- Кешування частих запитів
- Pagination для великих списків
- Lazy loading для важких компонентів
- Debounce/Throttle для частих подій
- Індекси в БД для частих запитів

## Code Review Checklist

Перед commit перевір:

- [ ] Код відповідає SOLID принципам
- [ ] Немає дублювання (DRY)
- [ ] Функції маленькі та фокусовані
- [ ] Імена змінних/функцій описові
- [ ] Обробка помилок присутня
- [ ] TypeScript типи правильні (немає `any`)
- [ ] Тести написані (якщо потрібно)
- [ ] Коментарі додані для складної логіки
- [ ] Безпека врахована (валідація, auth, тощо)
- [ ] Performance врахований (pagination, caching, тощо)
