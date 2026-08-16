# СТРОЙДОМ — DEMO PROJECT 01

Сайт строительной компании с калькулятором, приёмом заявок, Telegram-уведомлениями и mini-CRM.

**Демонстрационный проект для портфолио.** Компания вымышленная, контакты и заявки — тестовые.

Кейс: [`CASE.md`](./CASE.md) · Короткая версия: [`PORTFOLIO.md`](./PORTFOLIO.md) · Деплой: [`DEPLOY_VPS.md`](./DEPLOY_VPS.md) · Спецификация: [`SPEC.md`](./SPEC.md)

---

## О проекте

Полный цикл работы с обращением клиента в одном Next.js-приложении:

```
Сайт → калькулятор → форма → POST /api/leads → SQLite → Telegram
                                                  ↓
                              Менеджер → /leads (mini-CRM) → статусы
```

## Возможности

**Публичная часть**

- адаптивный лендинг: hero, преимущества, каталог проектов домов, этапы работ, галерея;
- калькулятор параметров дома: площадь, этажность, материал, комплектация (денежная стоимость не рассчитывается);
- форма заявки с автоподстановкой параметров из калькулятора;
- серверная валидация, honeypot и rate limit против спама;
- UTM-трекинг и сохранение landing URL.

**Mini-CRM `/leads`**

- вход по паролю, подписанная сессия (HMAC SHA-256, 8 часов);
- список последних 50 заявок, новые сверху;
- счётчики: всего / новые / в работе / продажи;
- фильтр по статусу и поиск по имени, телефону, Telegram;
- карточка заявки со всеми параметрами и UTM;
- смена статуса заявки;
- адаптив: таблица на desktop, карточки на мобильном.

## Технологии

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Prisma · SQLite · Zod · Telegram Bot API

---

## Локальный запуск

```bash
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run db:migrate
npm run dev
```

Открыть `http://localhost:3000`.

> `npm run dev` запускает обычный Next.js dev server **без Turbopack**.

## Environment variables

Все переменные задаются в локальном `.env` (файл в `.gitignore`, в репозиторий не попадает).

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | путь к SQLite. Локально `file:./dev.db` |
| `NEXT_PUBLIC_SITE_URL` | публичный origin сайта: OpenGraph, canonical, sitemap. Пусто локально |
| `TELEGRAM_BOT_TOKEN` | токен бота (только сервер) |
| `TELEGRAM_CHAT_ID` | чат для уведомлений (только сервер) |
| `CRM_PASSWORD` | пароль входа в mini-CRM (только сервер) |
| `CRM_SESSION_SECRET` | секрет подписи session cookie (только сервер) |
| `NEXT_PUBLIC_METRIKA_ID` | Яндекс.Метрика. Пока не подключена |

Шаблоны: [`.env.example`](./.env.example) (локально), [`.env.production.example`](./.env.production.example) (сервер).

Секреты никогда не передаются в браузер: префикс `NEXT_PUBLIC_` используется только для `SITE_URL` и `METRIKA_ID`.

## Prisma

```bash
npm run db:migrate      # prisma migrate dev — только для разработки
npm run db:deploy       # prisma migrate deploy — для production
npm run db:generate     # prisma generate
npm run db:studio       # визуальный просмотр базы
```

Модель `Lead` со статусами: `NEW`, `CONTACTED`, `QUOTE_SENT`, `NEGOTIATION`, `WON`, `LOST`.

## Telegram setup

1. Создать бота у [@BotFather](https://t.me/BotFather) и получить token.
2. Отправить боту `/start`.
3. Узнать `chat_id`: `https://api.telegram.org/bot<TOKEN>/getUpdates`.
4. Записать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` в `.env`, перезапустить `npm run dev`.

Уведомление отправляется **после** сохранения заявки в базу. Ошибка Telegram не ломает заявку — `POST /api/leads` всё равно возвращает `201`.

## CRM setup

1. Задать в `.env`:

```env
CRM_PASSWORD="отдельный_пароль_для_CRM"
CRM_SESSION_SECRET="длинная_случайная_строка"
```

`CRM_SESSION_SECRET` — секрет подписи cookie. Генерация в PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

В Linux/macOS: `openssl rand -base64 32`.

Не использовать Telegram token или `DATABASE_URL` в качестве пароля CRM.

2. Перезапустить `npm run dev`.
3. Открыть `http://localhost:3000/leads` и войти по `CRM_PASSWORD`.

Если переменные не заданы, CRM закрывается наглухо (`503 CRM is not configured`), а публичный сайт и приём заявок продолжают работать.

## API

| Метод | Endpoint | Доступ |
|-------|----------|--------|
| `POST` | `/api/leads` | публичный: Zod, honeypot, rate limit, Prisma, Telegram → `201` |
| `GET` | `/api/leads` | только CRM: последние 50, фильтр `?status=`, поиск `?q=`, `no-store` |
| `PATCH` | `/api/leads/[id]` | только CRM: меняет исключительно `status` |
| `POST` | `/api/crm/login` | rate limit на неудачные попытки |
| `POST` | `/api/crm/logout` | same-origin |
| `GET` | `/api/health` | публичный liveness: `{"status":"ok"}` |

Удаление и редактирование контактов заявки через API не реализовано намеренно.

## Development commands

```bash
npm run dev              # dev server (без Turbopack)
npm run build            # prisma generate + next build
npm start                # production server
npm run lint             # eslint

npm run db:clear-leads   # удалить все Lead (schema и миграции не трогает)
npm run db:seed-demo     # создать 6 демо-заявок для скриншотов
```

`db:clear-leads` и `db:seed-demo` запускаются **только вручную** и не подключены к install/build/start. В production их запускать нельзя.

## Production preparation

- сборка: `npm run build`, запуск: `npm start` (Next.js слушает `127.0.0.1:3000`);
- перед сервером стоит Nginx (80/443) с TLS от Let's Encrypt;
- автозапуск через systemd: [`deploy/stroydom.service.example`](./deploy/stroydom.service.example);
- конфиг прокси: [`deploy/nginx-stroydom.example.conf`](./deploy/nginx-stroydom.example.conf);
- миграции в production только через `npx prisma migrate deploy`;
- база хранится вне каталога приложения — `/var/lib/stroydom/stroydom.db`;
- полная пошаговая инструкция: [`DEPLOY_VPS.md`](./DEPLOY_VPS.md).

## Backup SQLite

Локально перед опасными операциями:

```bash
copy prisma\dev.db backups\dev-YYYY-MM-DD.db
```

На сервере:

```bash
sqlite3 /var/lib/stroydom/stroydom.db \
  ".backup '/var/backups/stroydom/stroydom-$(date +%F).db'"
```

Восстановление: остановить сервис, скопировать файл обратно, запустить сервис.  
Подробности и cron-пример — в [`DEPLOY_VPS.md`](./DEPLOY_VPS.md).

---

## Current status

| Этап | Статус |
|------|--------|
| ЭТАП 1 — структура проекта | готов |
| ЭТАП 2 — лендинг | готов |
| ЭТАП 3 — `POST /api/leads` | готов |
| ЭТАП 4 — Telegram | готов и реально протестирован |
| ЭТАП 5 — mini-CRM | готов |
| ЭТАП 6 — полировка и production preparation | готов |

**Реальный deploy на VPS не выполнялся.**

Следующий шаг: публикация на VPS по инструкции [`DEPLOY_VPS.md`](./DEPLOY_VPS.md).  
Для этого требуются доступ к серверу, домен и решение по Яндекс.Метрике.
