# СТРОЙДОМ

Демонстрационный full-stack проект сайта строительной компании.

**Live demo:** [https://stroydom-project.ru](https://stroydom-project.ru)

GitHub: [O-Simonov/stroydom-demo](https://github.com/O-Simonov/stroydom-demo)

---

## О проекте

Смоделирован типичный малый бизнес: строительство загородных домов под ключ. Сайт не только показывает услуги — он принимает обращение, сохраняет его и отдаёт менеджеру в работу.

Это **демонстрационный проект для портфолио**, не сайт реальной компании. Контент, контакты и заявки — тестовые.

## Что получает бизнес

Посетитель выбирает параметры дома и оставляет контакты. Заявка сразу попадает в базу, менеджер получает уведомление в Telegram, обращение появляется в закрытой CRM — и дальше ведётся по статусам, без Excel и переписок в мессенджере.

```
Посетитель → сайт → заявка → Telegram → CRM → обработка лида
```

## Возможности

### Клиентская часть

- адаптивный лендинг: услуги, проекты домов, этапы работ;
- подбор параметров дома (площадь, этажность, материал, комплектация);
- форма заявки с состояниями загрузки, успеха и ошибки;
- удобная работа с телефона;
- сохранение UTM и адреса страницы входа.

### Back-end

- `POST /api/leads` с серверной валидацией;
- хранение заявок в базе;
- уведомление в Telegram (сбой мессенджера не теряет заявку).

### Mini-CRM

- вход по паролю;
- список обращений, поиск и фильтр по статусу;
- карточка лида с параметрами и источником;
- смена статуса сделки;
- выход из сессии.

### Production

- Ubuntu VPS, Nginx, systemd;
- HTTPS (Let's Encrypt);
- резервные копии SQLite;
- health-check `/api/health`.

## Архитектура

```
Visitor
   ↓
Next.js Landing
   ↓
POST /api/leads
   ↓
Prisma → SQLite
   ↓
Telegram notification
   ↓
Mini-CRM /leads
```

Размещение:

```
Internet → HTTPS → Nginx → Next.js (127.0.0.1:3000) → Prisma → SQLite
```

Подробности деплоя: [`DEPLOY_BEGET.md`](./DEPLOY_BEGET.md).

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers, Zod, Prisma |
| База | SQLite |
| Интеграции | Telegram Bot API |
| Инфраструктура | Ubuntu, Nginx, systemd, Let's Encrypt, GitHub |

## Безопасность

- секреты только на сервере, не в браузере;
- CRM за паролем, сессия в HttpOnly-cookie (`Secure` в production, `SameSite`);
- серверная валидация, honeypot и базовый rate limit;
- CRM-эндпоинты закрыты без сессии;
- сайт за HTTPS, приложение слушает только localhost за Nginx.

## Скриншоты

**Live demo:** [https://stroydom-project.ru](https://stroydom-project.ru)

Mini-CRM показана на скриншотах ниже; production CRM защищена авторизацией и не предназначена для публичного входа.

### Главная страница

![Главная страница СТРОЙДОМ](./docs/screenshots/01-home-desktop.png)

### Подбор параметров

![Подбор параметров дома](./docs/screenshots/02-parameters-desktop.png)

### Заявка

![Форма заявки](./docs/screenshots/03-form-desktop.png)

### Mini-CRM

![Mini-CRM — список demo-заявок](./docs/screenshots/06-crm-desktop.png)

### Карточка лида

![Карточка demo-лида в CRM](./docs/screenshots/07-crm-details.png)

### Mobile

![Главная страница на мобильном](./docs/screenshots/04-home-mobile.png)

![CRM на мобильном](./docs/screenshots/08-crm-mobile.png)

Полный чеклист кадров: [`SCREENSHOTS.md`](./SCREENSHOTS.md). Разбор кейса: [`CASE.md`](./CASE.md) · короткая карточка: [`PORTFOLIO.md`](./PORTFOLIO.md)

## Локальный запуск

```bash
git clone https://github.com/O-Simonov/stroydom-demo.git
cd stroydom-demo
npm ci
cp .env.example .env
```

В `.env` задайте `DATABASE_URL`, при необходимости Telegram и CRM-переменные (значения не коммитить).

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000). CRM: `/leads`.

## Статус проекта

СТРОЙДОМ — демонстрационный проект, созданный для портфолио.  
Названия компании, контент и заявки используются исключительно в демонстрационных целях.
