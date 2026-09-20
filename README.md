# URL Shortener

Monorepo для сервиса коротких ссылок. На текущем этапе подготовлены независимые frontend- и backend-приложения для дальнейшей разработки.

## Требования

- Node.js 22 LTS
- pnpm 11 или новее
- Docker с поддержкой Docker Compose

## Установка

```bash
pnpm install
```

Создайте локальный файл окружения:

```bash
cp .env.example .env
```

Замените демонстрационный пароль в `.env`. Значения `POSTGRES_USER`,
`POSTGRES_PASSWORD` и `POSTGRES_DB` должны совпадать с соответствующими частями
`DATABASE_URL`.

## База данных

Запустить локальный PostgreSQL и дождаться его готовности:

```bash
pnpm db:up
```

Применить все сохранённые migrations и проверить подключение к таблице `links`:

```bash
pnpm db:migrate
pnpm db:check
```

Остановить контейнер, сохранив данные в Docker volume:

```bash
pnpm db:down
```

После изменения Drizzle-схемы создать следующую migration и применить её:

```bash
pnpm db:generate
pnpm db:migrate
```

Сгенерированные SQL- и meta-файлы из `apps/api/drizzle` должны сохраняться в
репозитории. API не применяет migrations автоматически и завершает запуск с
ошибкой, если PostgreSQL или таблица `links` недоступны.

## Разработка

После запуска PostgreSQL и применения migrations запустить оба приложения:

```bash
pnpm dev
```

Или по отдельности из корня репозитория:

```bash
pnpm dev:web
pnpm dev:api
```

Vite frontend доступен по адресу, который выводит команда запуска (по умолчанию `http://localhost:5173`). API запускается на `http://127.0.0.1:3000`.

### Health check

```bash
curl http://127.0.0.1:3000/health
```

Ответ:

```json
{
  "status": "ok"
}
```

### Создание короткой ссылки

```bash
curl --request POST http://127.0.0.1:3000/api/links \
  --header 'content-type: application/json' \
  --data '{"url":"https://example.com/some/long/path"}'
```

Успешный запрос возвращает `201 Created`:

```json
{
  "code": "a8Fk2Qp",
  "url": "https://example.com/some/long/path",
  "shortUrl": "http://localhost:3000/a8Fk2Qp"
}
```

Значение `PUBLIC_BASE_URL` задаёт публичный базовый адрес, используемый в
`shortUrl` и OpenAPI-документации.

### OpenAPI

После запуска API доступны:

- Swagger UI: `http://127.0.0.1:3000/documentation`;
- OpenAPI JSON: `http://127.0.0.1:3000/documentation/json`;
- OpenAPI YAML: `http://127.0.0.1:3000/documentation/yaml`.

## Проверки

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Для форматирования файлов:

```bash
pnpm format
```

## Структура

```text
apps/
  api/       Fastify API
  web/       Vue 3 + Vite frontend
packages/
  shared/    Общие контракты и утилиты
```
