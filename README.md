# URL Shortener

Monorepo для сервиса коротких ссылок. На текущем этапе подготовлены независимые frontend- и backend-приложения для дальнейшей разработки.

## Требования

- Node.js 22 LTS
- pnpm 11 или новее

## Установка

```bash
pnpm install
```

## Разработка

Запустить оба приложения:

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

## Проверки

```bash
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

На этапе bootstrap база данных, сокращение ссылок и переменные окружения ещё не нужны.
