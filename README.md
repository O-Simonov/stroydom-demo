# DEMO PROJECT 01 — СТРОЙДОМ

Демонстрационный лендинг строительной компании для портфолио.

Спецификация: [`SPEC.md`](./SPEC.md)

## Статус

- ЭТАП 1 — готов.
- ЭТАП 2 — готов.
- ЭТАП 3 — готов.
- ЭТАП 4 — готов и реально протестирован.
- ЭТАП 5 — mini-CRM — готов.

## Команды

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run dev
npm run lint
npm run build
npm run db:studio
```

> `npm run dev` запускает обычный Next.js dev server **без Turbopack**.

## API

### `POST /api/leads` (публичный)

Создаёт заявку в SQLite и после записи отправляет Telegram (best-effort).

### `GET /api/leads` (только CRM)

Список последних 50 заявок. Query: `status`, `q`.

### `PATCH /api/leads/[id]` (только CRM)

Меняет только `status`.

### `POST /api/crm/login` / `POST /api/crm/logout`

Вход и выход mini-CRM.

## CRM SETUP

1. В `.env` задайте:

```env
CRM_PASSWORD="your_crm_password"
CRM_SESSION_SECRET="your_random_secret"
```

`CRM_SESSION_SECRET` — секрет подписи cookie (достаточно длинная случайная строка).  
Пример генерации в PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Не используйте Telegram token или DATABASE_URL как пароль CRM.

2. Перезапустите:

```bash
npm run dev
```

3. Откройте: `http://localhost:3000/leads`  
4. Войдите с `CRM_PASSWORD`.

Реальные значения — только в локальном `.env` (в `.gitignore`).

## TELEGRAM SETUP

1. Создайте бота у [@BotFather](https://t.me/BotFather), получите token.
2. Напишите боту `/start`, затем узнайте `chat_id` через `getUpdates`.
3. В `.env` задайте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (без реальных значений в git/README).
4. Перезапустите `npm run dev`.

Уведомление уходит **после** записи заявки в SQLite. Ошибка Telegram не ломает `POST /api/leads` (всё равно `201`).
