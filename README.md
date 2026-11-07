# AIGameAssistant

ИИ-ассистент для настольных игр. Каталог с поиском, категориями и избранным, просмотр PDF-правил, история диалогов и потоковые ответы ИИ. Администратор управляет играми, пользователями и настройками ассистента.

## Стек

- Frontend: Next.js 16 App Router, React 19, TypeScript, FSD, SCSS Modules.
- Backend: Java 21, Spring Boot 3.5, PostgreSQL, Liquibase.
- ИИ: OpenRouter. Локальная почта: Mailpit.
- Проверки: ESLint, Stylelint, Prettier, Jest и Playwright.
- Запуск: Docker Compose.

## Запуск

Нужны Docker и Compose v2. В корне проекта:

```bash
cp .env.example .env
```

Заполните `.env`: `POSTGRES_PASSWORD`, разные `JWT_SECRET_ACCESS` и `JWT_SECRET_REFRESH`, а также `ADMIN_EMAIL`, `ADMIN_LOGIN`, `ADMIN_PASSWORD`. Каждый JWT-секрет сгенерируйте отдельно командой `openssl rand -base64 64`. Администратор создаётся, если такого email ещё нет.

```bash
docker compose up --build -d --wait --wait-timeout 240
```

Сайт: [http://localhost](http://localhost). Порт задаёт `APP_PORT`; `APP_PUBLIC_URL` должен совпадать с адресом сайта в браузере, включая схему и порт. Для публичного размещения используйте HTTPS. Секреты из `.env` не добавляйте в Git.

Основные команды из корня:

```bash
docker compose logs -f          # журналы сервисов
docker compose up --build -d    # пересобрать и обновить приложение
docker compose down            # остановить, сохранив БД и файлы
```

Для разработки frontend нужны Node.js 22.13+ и npm 10+. Сначала запустите backend:

```bash
APP_PUBLIC_URL=http://localhost:3000 docker compose up --build -d backend
```

API доступен только локально на `127.0.0.1:8080`. `APP_PUBLIC_URL` в команде задаёт адрес frontend для ссылок из писем.

Затем в другом терминале:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000). В `.env.local` по умолчанию указаны `BACKEND_URL=http://127.0.0.1:8080` и `APP_PUBLIC_URL=http://localhost:3000`.

Основные команды из `frontend/`:

```bash
npm run check          # lint, TypeScript, тесты и production build
npm run format         # форматирование Prettier
npm run build          # production-сборка
npm exec playwright install chromium  # один раз перед E2E
npm run test:e2e        # браузерные тесты после build
```

Backend-тесты: `cd backend && ./gradlew test`.

## Подключение ИИ-моделей

Для ответов нужен `OPENROUTER_API_KEY`; для платных моделей — баланс OpenRouter. Каталог находится в `backend/config/ai-models.yaml`:

- `id` — внутренний идентификатор;
- `name` — название в интерфейсе;
- `remote-id` — идентификатор модели OpenRouter;
- `enabled` — доступность;
- `max-output-tokens` — предел ответа.

`default-model` должен указывать на доступную модель. Модель по умолчанию также меняется в админке. После изменения YAML выполните `docker compose restart backend`; после изменения `.env` — `docker compose up -d backend`.

SOCKS5-прокси необязателен: `PROXY_HOST`, `PROXY_PORT`, `PROXY_LOGIN`, `PROXY_PASSWORD`. Без прокси оставьте `PROXY_HOST` пустым.

## Подключение почты

По умолчанию письма доступны в локальном [Mailpit](http://localhost:8025). Для отправки через Gmail укажите в корневом `.env`:

```dotenv
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
EMAIL_ADDRESS=sender@example.com
EMAIL_APP_PASSWORD=your-app-password
SMTP_AUTH=true
SMTP_STARTTLS=true
APP_PUBLIC_URL=https://your-domain.example
```

`EMAIL_ADDRESS` используется как SMTP-логин и отправитель. Подставьте собственные значения и примените `docker compose up -d backend`. При изменении публичного адреса также пересоздайте frontend: `docker compose up -d frontend`.
