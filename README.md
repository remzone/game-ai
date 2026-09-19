# Пепельная корона — Living World RPG

Запускаемая **alpha 0.1** single-player браузерной RPG по [исходному ТЗ](docs/MASTER_PROMPT.ru.txt).
Это первая рабочая вертикаль, **не полная реализация всех 20 разделов ТЗ**.
Точный объём и оставшиеся задачи: [STATUS.md](docs/STATUS.md).

## Быстрый запуск: Docker

Требуются Docker Engine/Desktop и Docker Compose v2. В Windows выполняйте команды в Ubuntu/WSL из каталога проекта.

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f app
```

Откройте **http://localhost:3000**. Миграции выполняются автоматически после готовности PostgreSQL.
Создайте героя, оставьте seed `ashen-crown`, нажмите «Начать историю».
Необязательная команда `npm run db:seed` создаёт пустой начальный мир только при отсутствии автосохранения; для обычного запуска она не нужна.

Остановка: `docker compose down`. Данные остаются в томе `pgdata`.
**Не добавляйте `-v` к down**, если хотите сохранить игры.

## Первые действия в игре

1. «Войти в поселение» → примите контракт на волков → «Нанять 5 бойцов».
2. «Выступить против волков» → щёлкните по полю, чтобы направить бойцов; бой считается сервером в реальном времени.
3. После победы вернитесь, войдите в поселение и сдайте принятый контракт, пока мир стоит на паузе.
4. Купите зерно; оно потребуется в путешествии. Выберите другое поселение на карте и нажмите «Отправиться».
5. Используйте ×1/×2/×5/×10. По умолчанию ×1 = один игровой день за секунду; в бою ускорение календаря отключено.
6. Откройте «Слоты»: пять ручных сохранений + автосохранение. Загрузка всегда ставит мир на паузу.

Пробел — пауза; E — вход в текущее поселение. Приказы, торговля и действия проверяются движком.
В стартовом мире 300 поселений и 18 000 отдельных жителей; герой и его родители добавляются при создании персонажа.
Начальная география не меняется от seed, политика и население воспроизводимы по seed.

## Разработка без Docker

Node.js **22.12+** (проверено на Node 24), npm.

```bash
cp .env.example .env
npm ci
npm run db:generate
```

В `.env` установите `STORAGE_DRIVER=file` и `PUBLIC_ORIGIN=http://localhost:5173`.
Файловый адаптер сохраняет тот же полный снимок мира, что и PostgreSQL.

```bash
npm run dev
```

Клиент: http://localhost:5173; сервер: http://localhost:3000. Vite проксирует `/api` и `/ws`.
Пакет движка автоматически пересобирается, сервер перезапускается при изменении собственного кода.
После изменения движка перезапустите сервер, если его watcher не заметил обновление зависимого пакета.

### Разработка с PostgreSQL

```bash
docker compose up -d db
```

В `.env`: `STORAGE_DRIVER=postgres`, `DATABASE_URL` из примера (с вашим паролем), `PUBLIC_ORIGIN=http://localhost:5173`.

```bash
npm run db:migrate
npm run dev
```

### Собранное приложение без Docker

В `.env` установите `PUBLIC_ORIGIN=http://localhost:3000`. Если PostgreSQL не запущен, используйте `STORAGE_DRIVER=file`.

```bash
npm run build
npm start
```

## Проверки

```bash
npm test
npm run build
npm run check
npm run format:check
npm run bench -- 100000 30
# Проверка миллиона личностей; потребление памяти зависит от среды:
npm run bench -- 1000000 30
```

Для интеграционного теста PostgreSQL используйте **отдельную тестовую БД**: тест перезаписывает слот 5.

```bash
DATABASE_URL=postgresql://rpg:localdev@localhost:5432/rpg_test npm run db:migrate
TEST_POSTGRES=1 DATABASE_URL=postgresql://rpg:localdev@localhost:5432/rpg_test npm test
```

GitHub Actions проверяет сборку, движок, API, миграцию и PostgreSQL. Отдельное задание собирает и запускает Docker Compose и выполняет HTTP smoke test.
Фактически выполненные при подготовке проверки перечислены в [VALIDATION.md](docs/VALIDATION.md).

## OpenRouter (необязательно)

```dotenv
OPENROUTER_API_KEY=ваш_ключ
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

Перезапустите сервер (в Docker: `docker compose up -d --force-recreate app`).
Затем в игре: **Admin → Включить AI Director → Сохранить настройки**.
По умолчанию AI выключен; максимум 10 запросов на мир, интервал 30 игровых дней.
Поддержка structured outputs зависит от выбранной модели/провайдера; неподдерживаемый ответ отклоняется и попадает в журнал.
Ключ не передаётся клиенту и не записывается в сохранение.

Director отправляет только ограниченный контекст исторических событий и получает JSON proposal.
В первой версии он запрашивает субъективные хроники. Движок также имеет валидаторы `assign_nickname` и `spawn_quest`, которые можно подключить к расширенному Director.
Ни недоступный API, ни ошибочный ответ не останавливают симуляцию.
Схема интеграции сверена с [документацией OpenRouter](https://openrouter.ai/docs/guides/features/structured-outputs).

## Linux deployment

1. Установите Docker/Compose, скопируйте проект или клонируйте репозиторий.
2. Создайте `.env`. Задайте уникальные `POSTGRES_PASSWORD`, `GAME_PASSWORD`, `PUBLIC_ORIGIN=https://your-game.example`.
   Для пароля PostgreSQL в URL используйте URL-safe символы, например шестнадцатеричную строку.
3. Выполните `docker compose up --build -d`.
4. Настройте HTTPS reverse proxy (Caddy/Nginx/Traefik) на `127.0.0.1:3000`, с поддержкой WebSocket.
   Compose по умолчанию публикует порт только на localhost.
5. Откройте свой домен и войдите с `GAME_PASSWORD`.

Один экземпляр приложения = один общий мир. Это single-player сервер, не многопользовательский сервис.
Не запускайте несколько экземпляров backend для одной БД: активная симуляция находится в памяти процесса.
При обновлении выполните `docker compose up --build -d`; остановка сохраняет мир в слот 0.

Резервная копия:

```bash
docker compose exec -T db pg_dump -U rpg -d rpg > rpg-backup.sql
```

## Структура

```text
packages/simulation/   модели, RNG, команды, мир, экономика, бой, AI validator
apps/server/           Fastify, WebSocket, адаптеры сохранений, OpenRouter
apps/web/              React HUD, создание героя, три Phaser scenes, admin
prisma/                схема PostgreSQL, миграция, безопасный seed
tests/                 determinism, причинность, валидация, API, сохранения
scripts/               benchmark и HTTP smoke test
docs/                  исходное ТЗ, архитектура, статус и результаты проверок
```

Подробнее: [архитектура](docs/ARCHITECTURE.md), [план следующей разработки](docs/ROADMAP.md).

## Git / GitHub

Репозиторий: https://github.com/remzone/game-ai

```bash
git clone https://github.com/remzone/game-ai.git
cd game-ai
cp .env.example .env
docker compose up --build -d
```

Секреты держите только в `.env`; этот файл исключён из Git и Docker build context.
