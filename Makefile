# Запуск frontend та backend одночасно
dev:
	@echo "🚀 Запуск frontend та backend..."
	@make -j2 dev-frontend dev-backend

# Запуск тільки frontend
dev-frontend:
	@echo "▶️  Запуск frontend..."
	@cd frontend && pnpm run dev

# Запуск тільки backend
dev-backend:
	@echo "▶️  Запуск backend..."
	@cd backend && pnpm run start:dev

# Запуск Docker контейнерів для backend
docker-up:
	@echo "🐳 Запуск Docker контейнерів..."
	@cd backend && docker-compose up -d

# Зупинка Docker контейнерів
docker-down:
	@cd backend && docker-compose down

# Повний запуск: Docker + Frontend + Backend
all: docker-up dev

# Встановлення залежностей
install:
	@echo "📦 Встановлення залежностей..."
	@cd backend && pnpm install
	@cd frontend && pnpm install

# Очистка
clean:
	@cd backend && docker-compose down -v

# Допомога
help:
	@echo "Доступні команди:"
	@echo "  make dev           - Запуск frontend та backend"
	@echo "  make dev-frontend  - Запуск тільки frontend"
	@echo "  make dev-backend   - Запуск тільки backend"
	@echo "  make docker-up     - Запуск Docker контейнерів"
	@echo "  make docker-down   - Зупинка Docker контейнерів"
	@echo "  make all           - Запуск Docker + Frontend + Backend"
	@echo "  make install       - Встановлення залежностей"
	@echo "  make clean         - Очистка Docker volumes"

.PHONY: dev dev-frontend dev-backend docker-up docker-down all install clean help
