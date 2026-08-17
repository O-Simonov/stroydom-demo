# SCREENSHOTS

Кадры для GitHub README и откликов. PNG лежат в `docs/screenshots/` и встроены в [`README.md`](./README.md), [`CASE.md`](./CASE.md), [`PORTFOLIO.md`](./PORTFOLIO.md).

Автосъёмка:

```bash
npm run portfolio:screenshots
```

Скрипт: `scripts/capture-portfolio-screenshots.mjs` (Playwright, Chromium).  
**Публичные кадры** — с https://stroydom-project.ru (форма не отправляется).  
**CRM-кадры** — только локально, demo-база. Production CRM не открывается.

## Подготовка CRM (только local)

Если в `prisma/dev.db` ещё нет ровно 6 demo Lead:

```bash
npm run db:clear-leads
npm run db:seed-demo
```

Не выполнять на VPS/production.

Перед коммитом кадра: нет паролей, токенов, `.env`, реальных телефонов, почты и имён заявителей.

---

## Таблица кадров

| Файл | Страница | Viewport | Что видно | Источник | Privacy | Статус |
|------|----------|----------|-----------|----------|---------|--------|
| `01-home-desktop.png` | `/` hero | 1440×1000 | Логотип, меню, заголовок, «Получить расчёт», «Посмотреть проекты» | production | только публичный лендинг | DONE |
| `02-parameters-desktop.png` | `#calculator` | 1440×1000 | Подбор: 150 м², 2 этажа, газобетон, под ключ, кнопка «Получить расчёт». Без денежной суммы | production | не отправлять форму | DONE |
| `03-form-desktop.png` | `#contact` | 1440×1000 | Форма. Демо: «Демо Клиент», `+7 900 000-00-00`, `@demo_client`. Параметры из калькулятора | production | **не Submit** | DONE |
| `04-home-mobile.png` | `/` hero | 390×844 | Главный экран, CTA, без горизонтального скролла | production | публичная страница | DONE |
| `05-form-mobile.png` | форма / CTA | 390×844 | Форма с demo-данными на мобильном | production | не Submit | DONE |
| `06-crm-desktop.png` | `/leads` | 1440×1000 | Счётчики, фильтры, таблица, разные статусы | **только local demo** | вымышленные имена/телефоны | DONE |
| `07-crm-details.png` | карточка лида | 1440×1000 | Иван Демонстрационный: параметры, статус, UTM | **только local demo** | без реальных ПДн | DONE |
| `08-crm-mobile.png` | `/leads` | 390×844 | Карточки заявок | **только local demo** | то же | DONE |

Опционально: `09-crm-login.png` — страница входа, без введённого пароля.

---

## Как переснять

1. Desktop: viewport 1440×1000, масштаб 100%, светлая тема.
2. Mobile: 390×844.
3. Имена файлов — как в таблице, PNG.
4. После изменений UI переснять нужные кадры и обновить README/CASE при необходимости.
