# TECHNICAL CASE — STROYDOM

## Overview

Demonstration full-stack product: corporate construction landing + lead API + SQLite + authenticated mini-CRM. Live public site runs in `SITE_MODE=demo` (no PII persistence from public form).

Repo: `O-Simonov/stroydom-demo`  
Stack versions from `package.json` / lock: Next `15.5.23`, React `19.1.0`, Prisma `6.19.3`, Zod `4.4.3`, Tailwind `4.3.3`, TypeScript `5.9.x`.

## Frontend

- Next.js App Router (`src/app`)
- React Server/Client components as needed
- Tailwind CSS v4
- Landing composition: Header, Hero, Benefits, HouseProjects, WorkSteps, Calculator, Portfolio, CustomerValue, LeadForm, Footer
- Calculator: parameter selection only (no monetary quote engine)

## Backend / API

| Method | Route | Role |
| --- | --- | --- |
| POST/GET | `/api/leads` | create (mode-dependent) / list for CRM |
| PATCH | `/api/leads/[id]` | status update |
| POST | `/api/crm/login` | session |
| POST | `/api/crm/logout` | logout |
| GET | `/api/health` | health |

No Next.js `middleware.ts`. CRM protection: page redirect + API session checks.

## Validation

- Zod schemas (`leadDemoSchema` / production schema with `consent: true`)
- Honeypot field `website`
- In-memory rate limit on public POST

## Data

- Prisma ORM, SQLite provider
- Lead model + status enum + consent evidence columns for production
- Migrations via Prisma Migrate (no force-reset in ops)

## Auth

- Shared CRM password (`CRM_PASSWORD`)
- HMAC-signed session cookie (`crm_session`), HttpOnly; Secure when Node `production`
- Same-origin checks on mutating CRM routes
- Login failure rate limiting

## Demo / production modes

- `SITE_MODE=demo` (default): simulate success; **no DB write**; **no Telegram**
- `SITE_MODE=production`: legal config gate → persist lead → best-effort Telegram (message: id + CRM link, no PII body fields)

## SEO / privacy routes

- Metadata, canonical, OG image route
- `robots.ts`, `sitemap.ts` (public pages only)
- JSON-LD `WebSite` only (no fake AggregateRating)
- `/privacy`, `/personal-data-consent`, `/cookies`

## Security baseline

Configured in `next.config.ts`: CSP, HSTS (prod Node), XCTO, XFO/frame-ancestors, Referrer-Policy, Permissions-Policy. CSP currently allows `'unsafe-inline'` / `'unsafe-eval'` for Next — future hardening note.

## Deployment (sanitized)

Linux VPS · Node `next start` under systemd · Nginx reverse proxy · HTTPS · SQLite file outside app tree · online SQLite backups · controlled migrate/deploy. Secrets and host internals are not part of portfolio copy.

## Explicit non-features

No Bitrix/amo, WhatsApp, email automation, payments, blog/CMS, analytics trackers in `src`, telephony, multi-tenant roles.
