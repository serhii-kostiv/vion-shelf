# VionShelf

Платформа для ведення особистих медіа-колекцій — книги, фільми, аніме, ігри та інше.

## Стек

**Backend** — NestJS, Prisma, PostgreSQL  
**Frontend** — Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS  
**Auth** — JWT + Refresh Tokens  
**Зовнішні API** — TMDB (фільми), Google Books (книги)

## Структура проєкту

```
vionshelf/
├── backend/     # NestJS API
├── frontend/    # Nuxt 4 додаток
└── Makefile     # Команди для запуску
```

## Швидкий старт

### 1. Встановлення залежностей

```bash
make install
```

### 2. Налаштування змінних середовища

```bash
cp backend/.env.example backend/.env
```

Заповни `backend/.env`:

| Змінна                   | Опис                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`           | PostgreSQL connection string                                                         |
| `JWT_SECRET`             | Секретний ключ для JWT                                                               |
| `JWT_EXPIRES_IN`         | Час життя access token (напр. `15m`)                                                 |
| `JWT_REFRESH_EXPIRES_IN` | Час життя refresh token (напр. `7d`)                                                 |
| `TMDB_API_KEY`           | API ключ з [themoviedb.org](https://www.themoviedb.org/settings/api)                 |
| `GOOGLE_BOOKS_API_KEY`   | API ключ з [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `PORT`                   | Порт сервера (за замовчуванням `3000`)                                               |

### 3. Запуск бази даних

```bash
make docker-up
```

### 4. Міграції

```bash
cd backend && pnpm prisma migrate dev
```

### 5. Запуск

```bash
# Frontend + Backend одночасно
make dev

# Або окремо
make dev-frontend
make dev-backend
```

Додаток доступний на:

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`

## Всі команди

```bash
make dev           # Запуск frontend + backend
make dev-frontend  # Тільки frontend
make dev-backend   # Тільки backend
make docker-up     # Запуск PostgreSQL в Docker
make docker-down   # Зупинка Docker контейнерів
make all           # Docker + Frontend + Backend
make install       # Встановлення залежностей
make db-studio     # Відкрити Prisma Studio
make clean         # Видалити Docker volumes
```

## API

Документація ендпоінтів — [`backend/API_DOCUMENTATION.md`](backend/API_DOCUMENTATION.md)

Базовий URL: `http://localhost:3000`

Основні модулі:

- `POST /auth/register` — реєстрація
- `POST /auth/login` — вхід
- `GET /collections` — колекції користувача
- `POST /collections/:id/items` — додати айтем до колекції
- `GET /search?query=...` — пошук медіа
- `GET /health` — статус сервера

## База даних

Схема — [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

```
User → Collection → CollectionItem → MediaItem
              ↓
         Like, Comment
```

Для перегляду даних через UI:

```bash
make db-studio
```
