# AIGameAssistant

ИИ-ассистент для настольных игр. Помогает разбираться в правилах и спорных ситуациях: выберите игру, откройте PDF-правила и задайте вопрос в чате. Доступны поиск, категории, избранное, история диалогов и выбор ИИ-модели. Администраторы управляют играми, пользователями и настройками ассистента.

Стек: React и TypeScript, Java 21 и Spring Boot, PostgreSQL. Приложение запускается через Docker Compose.

## Запуск

Установите Docker с Compose v2. В корне проекта создайте `.env` из примера:

```bash
cp .env.example .env
```

Заполните в `.env`:

| Поле | Значение |
| --- | --- |
| `POSTGRES_PASSWORD` | Пароль базы данных |
| `JWT_SECRET_ACCESS` | Случайный секрет access-токенов |
| `JWT_SECRET_REFRESH` | Другой случайный секрет refresh-токенов |
| `ADMIN_EMAIL` | Email первого администратора для входа |
| `ADMIN_LOGIN` | Логин первого администратора |
| `ADMIN_PASSWORD` | Пароль первого администратора |
| `OPENROUTER_API_KEY` | Ключ OpenRouter для ответов ИИ |

Для генерации пароля базы можно использовать `openssl rand -hex 32`. Для каждого JWT-секрета отдельно выполните `openssl rand -base64 64` и вставьте результат в соответствующее поле. Пароль администратора задайте самостоятельно. Администратор создаётся при первом запуске; изменение этих полей не обновляет уже созданную учётную запись.

Для локального запуска остальные значения можно оставить как в примере: `APP_PORT=80`, `APP_PUBLIC_URL=http://localhost`, база `POSTGRES_DB=game_assistant_db`, пользователь `POSTGRES_USER=app_user`. Поля `SPRING_DATASOURCE_*` для Docker заполнять не нужно: Compose задаёт их из `POSTGRES_*`. Прокси необязателен — оставьте `PROXY_HOST` пустым. Настройки почты приведены ниже; без SMTP письма доступны в Mailpit.

Запустите приложение из корня:

```bash
docker compose up --build -d --wait --wait-timeout 240
```

Сайт: [http://localhost](http://localhost). Для входа администратором используйте `ADMIN_EMAIL` и `ADMIN_PASSWORD`. Заполненный `.env` содержит секреты и не должен попадать в Git.

## ИИ-модели

Укажите `OPENROUTER_API_KEY` в корневом `.env`. Для платных моделей пополните баланс OpenRouter. Список моделей находится в `backend/config/ai-models.yaml`: `id` — внутренний идентификатор, `name` — название в интерфейсе, `remote-id` — идентификатор OpenRouter, `enabled` — доступность, `max-output-tokens` — предел ответа. `default-model` должен совпадать с `id` доступной модели. Модель по умолчанию также можно выбрать в админке.

После изменения каталога выполните `docker compose restart backend`. После изменения `.env` — `docker compose up -d backend`. При необходимости SOCKS5-прокси задаётся через `PROXY_HOST`, `PROXY_PORT`, `PROXY_LOGIN` и `PROXY_PASSWORD`.

## Почта

По умолчанию письма подтверждения и восстановления пароля доступны только в локальном [Mailpit](http://localhost:8025). Для отправки через Gmail задайте в корневом `.env`:

```dotenv
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
EMAIL_ADDRESS=sender@example.com
EMAIL_APP_PASSWORD=your-app-password
SMTP_AUTH=true
SMTP_STARTTLS=true
APP_PUBLIC_URL=http://localhost
```

Замените адрес и пароль приложения своими. `EMAIL_ADDRESS` используется как SMTP-логин и отправитель. Для размещённого сайта укажите в `APP_PUBLIC_URL` его публичный адрес — он используется в ссылках из писем. Примените настройки: `docker compose up -d backend`.
