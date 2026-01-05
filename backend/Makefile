# Запуск мікросервісів
docker-up:
	docker-compose up -d

# Зупинка контейнерів
docker-stop:
	docker-compose stop

# Видалення контейнерів
docker-down:
	docker-compose down

# Перегляд логів
docker-logs:
	docker-compose logs -f

# Глобальний clean
clean:
	docker-compose down -v

# Команди для запуску сервера
dev:
	pnpm run start:dev

# Перегляд студії
studio:
	pnpm run db:studio

# Запуск всіх мікросервісів
all:
	docker-compose up -d
	pnpm run start:dev
