# STROYDOM — Feature matrix (portfolio claims)

Только фактически реализованное. Для упаковки кейса.

| FEATURE | IMPLEMENTED | EVIDENCE | CAN CLAIM IN PORTFOLIO |
| --- | --- | --- | --- |
| Next.js 15 App Router | Yes | `package.json`, `src/app/**` | Yes |
| React 19 + TypeScript | Yes | `package.json`, `.tsx` | Yes |
| Tailwind CSS v4 | Yes | `tailwindcss` / lock | Yes |
| Корпоративный лендинг (секции) | Yes | Hero, Benefits, Projects, Steps, Calculator, Portfolio, Form, Footer | Yes |
| Адаптивная вёрстка | Yes | desktop table / mobile cards CRM; mobile screenshots | Yes |
| Подбор параметров дома | Yes | `Calculator.tsx` (не денежный расчёт) | Yes — как параметрный подбор |
| Форма заявки | Yes | `LeadForm.tsx` | Yes |
| Серверная валидация (Zod) | Yes | `src/lib/validation/lead.ts` | Yes |
| Honeypot + rate limit заявок | Yes | API leads | Yes |
| UTM / landing URL | Yes | attribution + Zod | Yes |
| Prisma + SQLite | Yes | `prisma/schema.prisma` | Yes |
| Mini-CRM `/leads` | Yes | CRM components + API | Yes |
| Auth CRM (пароль + session cookie) | Yes | `lib/crm/session.ts` | Yes |
| Статусы сделок (6) | Yes | `lib/crm/status.ts` | Yes |
| Поиск / фильтр / счётчики CRM | Yes | CrmBoard / filters / stats | Yes |
| Telegram (production, без ПДн в тексте) | Yes | `lib/telegram.ts` | Yes — только для production-режима |
| SITE_MODE demo / production | Yes | `lib/siteMode.ts` | Yes |
| Demo: без записи ПДн и без Telegram | Yes | `api/leads` demo branch | Yes (live demo) |
| Privacy / consent / cookies pages | Yes | `/privacy`, `/personal-data-consent`, `/cookies` | Yes |
| SEO metadata, OG, robots, sitemap | Yes | `layout.tsx`, `robots.ts`, `sitemap.ts` | Yes — «техническая SEO-база» |
| JSON-LD WebSite | Yes | `HomeJsonLd.tsx` | Yes |
| Security headers (CSP, HSTS, …) | Yes | `next.config.ts` | Yes |
| Health check | Yes | `/api/health` | Yes |
| VPS: Nginx + systemd + HTTPS + backups | Documented / live | deploy docs + live domain | Yes (без деталей сервера) |
| Next.js middleware | **No** | нет `middleware.ts` | **No** |
| WhatsApp / телефония / email-рассылки | **No** | нет в `src` | **No** (только как опции развития) |
| Bitrix24 / amoCRM | **No** | нет в `src` | **No** (опции) |
| Онлайн-оплата | **No** | нет | **No** |
| Blog / CMS | **No** | нет | **No** |
| Analytics trackers в коде | **No** | compliance tests | **No** (опция) |
| KPI / рост продаж / реальный заказчик | **No** | demo project | **No** |

Live demo на момент упаковки: `SITE_MODE=demo` — публичная форма **не** сохраняет заявки в БД.
