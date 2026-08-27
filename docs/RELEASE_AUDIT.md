# RELEASE AUDIT — STROYDOM

**Audit date:** 2026-08-27 (updated after local compliance fix)  
**Production domain:** https://stroydom-project.ru  
**Repository:** O-Simonov/stroydom-demo  
**Local path:** `portfolio/project-01-construction`  
**Compliance rule:** `.cursor/rules/website-compliance.mdc` (`alwaysApply: true`)

**Disclaimer:** This file is a technical/compliance readiness record. It is **not** a legal opinion that the site “fully complies” with Russian law. Automated tool scores are not release blockers.

---

## Executive Summary

| Area | Status |
| --- | --- |
| Default `SITE_MODE` | **demo** |
| Demo public form persists visitor PII | **No** (server-enforced) |
| Privacy / consent / cookies pages | **Present** |
| Production PD collection without legal config | **Blocked by technical gate** |
| Final verdict (local demo readiness) | **READY FOR DEMO DEPLOY** |
| Final verdict (real client production) | **READY WITH OWNER ACTIONS** until owner completes checklist |

---

## Architecture

- Next.js 15.5.23 / React 19 / Prisma SQLite / npm  
- `SITE_MODE=demo|production` (`src/lib/siteMode.ts`)  
- Legal gate: `src/lib/legalConfig.ts` + `npm run compliance:check` + `instrumentation.ts`  
- Demo: `POST /api/leads` simulates success, **no DB write**, **no Telegram**  
- Production: requires legal env + `consent: true` (Zod) + stores `consentGiven` / `consentTimestamp` / `consentDocumentVersion`  
- Telegram (production): lead **id** + CRM link only (no name/phone/comment)

---

## Legal applicability

| Norm | Applicable to current demo? | Notes |
| --- | --- | --- |
| 152-FZ | Demo: PD not persisted via public form | Production: yes when form saves leads |
| Separate consent | Demo: N/A (no PD collection) | Production: required in form + API |
| Privacy policy | Yes — `/privacy` reflects demo honesty / production template | |
| Roskomnadzor | Owner action before real processing | Not auto-PASS |
| Localization | Owner/ops confirmation before production | |
| Cross-border | Telegram minimized; residual review if foreign processors remain | |
| Russian language | Public UI primarily RU | |
| Consumer 2300-1 | Lead-gen demo; no online checkout | Softened demo claims |
| 38-FZ | NOT APPLICABLE (no third-party ads) | |
| 54-FZ | NOT APPLICABLE (no payments) | |

---

## Personal Data / 152-FZ

### Demo
- Public form does **not** persist name/phone/telegram/comment.  
- Server returns `{ demo: true }` without `prisma.lead.create`.

### Production (prepared)
- Fields as before + consent evidence columns (migration `20260827180000_lead_consent_evidence`).  
- **Migration not applied to production VPS in this task.**

**Status:** PASS for demo architecture; production depends on owner config.

---

## Consent

- Page: `/personal-data-consent` (separate document, version `CONSENT_DOCUMENT_VERSION=1.0`)  
- Production form: checkbox default **false**, required, links to consent + privacy  
- API: `z.literal(true)` — `false`/missing rejected  
- Demo: consent UI not required (no PD processing)

**Status:** PASS (technical)

---

## Privacy

- `/privacy` — 200, mode-aware content  
- Demo text states no PD persistence  
- Production text uses env operator fields; does **not** claim RKN registration

**Status:** PASS (technical)

---

## Roskomnadzor

Owner checklist (do not mark PASS in code):

- [ ] Определена применимость уведомления Роскомнадзора  
- [ ] Если требуется — выполнено до реальной обработки  
- [ ] Статус подтверждён владельцем  

**Status:** NEEDS OWNER ACTION

---

## Localization

- [ ] Подтверждено размещение первичного сбора/хранения ПДн в соответствующей российской инфраструктуре, когда это требуется  

Beget/VPS docs are operational hints, not legal proof.

**Status:** NEEDS OWNER ACTION

---

## Cross-border

- Telegram payload minimized (id + CRM URL).  
- Unsplash images / next/font — not lead PII.  
- If owner re-introduces PII to foreign processors: **NEEDS LEGAL REVIEW**

**Status:** PASS for minimized design; residual NEEDS LEGAL REVIEW if Telegram/other foreign use is expanded

---

## Russian Language

- Replaced user-facing “Mini CRM” → «Учёт заявок»  
- Benefits/customer copy softened as demo illustrations  
- Brands/Telegram/URL left where appropriate  

**Status:** PASS with minor NEEDS REVIEW on residual Latin tech tokens

---

## Consumer Protection

- No online contract/payment  
- Demo disclosure in footer/form  
- Misleading hard guarantees softened  

**Status:** PASS for demo; owner replaces claims for real client

---

## Advertising / Payments

- Advertising: NOT APPLICABLE  
- 54-FZ: NOT APPLICABLE  

---

## Cookies / Trackers

| Cookie | Category |
| --- | --- |
| `crm_session` | ESSENTIAL (HttpOnly, SameSite=Lax, Secure in production NODE_ENV, 8h) |

No analytics/marketing trackers in `src/`.  
`/cookies` documents reality. No complex banner.

**Status:** PASS

---

## Security

| Control | Status |
| --- | --- |
| HTTPS / TLS (prod domain) | PASS (prior live check) |
| HSTS | Added for `NODE_ENV=production` responses |
| CSP | Added (allows Next inline + Unsplash images) |
| X-Frame-Options DENY / frame-ancestors none | Added |
| Referrer-Policy | Added |
| Permissions-Policy | Added |
| X-Content-Type-Options | Added |
| CRM auth + noindex | PASS |
| Rate limit | In-memory — document multi-instance limit |

**Status:** PASS (technical baseline)

---

## SEO

- robots / sitemap (includes legal pages, excludes CRM)  
- canonical / metadata / H1 preserved on home  
- favicon.ico → redirect to `/icon.svg`  
- JSON-LD: `WebSite` only (no fake Organization/ratings)  

**Status:** PASS

---

## Accessibility

- Consent checkbox labelled, keyboard-focusable  
- Form `aria-live` / roles retained  
- Legal pages semantic article/h1  

**Status:** PASS (practical fixes); full WCAG not claimed

---

## TECHNICALLY FIXED

1. `SITE_MODE` demo/production  
2. Demo API does not persist PII / no Telegram on demo submit  
3. `/privacy`, `/personal-data-consent`, `/cookies`  
4. Production consent UX + Zod + DB evidence fields + migration file  
5. Production legal gate + compliance script + instrumentation  
6. Telegram PII minimization  
7. Security headers + favicon redirect  
8. Softened demo marketing claims + CRM RU labels  
9. Safe WebSite JSON-LD  
10. OWNER_CONFIGURATION.md  

---

## OWNER ACTION REQUIRED

See **CLIENT / OWNER ACTIONS** and `docs/OWNER_CONFIGURATION.md`.

---

## NEEDS LEGAL REVIEW

1. Lawful bases beyond consent if owner chooses another 152-FZ basis  
2. Residual cross-border assessment for Telegram Bot API even with minimized payload  
3. Whether portfolio demo historically collected any live PD before this fix (cleanup/retention of old DB rows on VPS — ops/legal)  

---

## OPTIONAL SUPPORTING AUDITS

### PR-CY
- Status: RUN (earlier) — optional supporting only  
- Scores are **not** blockers  

### Auditikk
- Status: RUN (earlier demo, incomplete crawl) — optional supporting only  
- Scores are **not** blockers  

---

## CLIENT / OWNER ACTIONS

Specific to STРОЙДОМ architecture (not a generic paste):

1. Decide go-live as **demo portfolio** (keep `SITE_MODE=demo`) vs real operator (`production`).  
2. If production: provide `LEGAL_*` / privacy contact / retention days without placeholders.  
3. Confirm RKN notification applicability and complete filing if required **before** real PD processing.  
4. Confirm localization of SQLite/hosting for RF citizens’ primary storage when required.  
5. Set retention policy and operational deletion process (auto-delete not implemented).  
6. Confirm Telegram remains acceptable; do not re-enable PII in bot messages without review.  
7. Replace Unsplash/demo project visuals and soft claims with real assets/terms if marketed as a real builder.  
8. Apply Prisma consent migration on the **target** database during a controlled release (not done on prod in this task).  
9. For multi-instance hosting: replace in-memory rate limit with shared store.  
10. Re-run live acceptance on domain after deploy; keep CRM password/secret unique.

---

## Owner Data Required

1. Legal status + name/FIO  
2. ИНН (+ ОГРН/ОГРНИП if applicable)  
3. Address, phone, email, privacy contact  
4. Retention days  
5. RKN status decision  
6. Localization confirmation  
7. Real content assets if leaving demo marketing  

---

## Blockers

### For DEMO deploy (safe portfolio)
- None technical after this local fix (pending successful lint/build/tests in verification section).

### For REAL production PD collection
1. Missing owner legal env / RKN / localization confirmations  
2. Production DB migration for consent columns not applied on VPS yet  
3. Live production still may run **old** code until a future deploy (this task does not deploy)

---

## PRE-DEPLOY REVIEW (2026-08-27)

| Item | Result |
| --- | --- |
| Migration | Additive `ADD COLUMN` only; `consentGiven DEFAULT false`; timestamp/version nullable; no DROP/RENAME/rebuild |
| Historical leads | Remain valid; consent **not** backfilled as true |
| CRM compatibility | UI does not require consent fields; list/detail use existing fields |
| `SITE_MODE` default | `demo` if unset — production collection cannot activate by accident |
| Demo public POST | No `prisma.lead.create`, no Telegram |
| Existing CRM data | Not hidden/deleted/rewritten by demo mode |
| HSTS | `max-age=31536000` without `includeSubDomains`/`preload` (www HTTPS not confirmed) |
| CSP | self + Unsplash images; `unsafe-inline`/`unsafe-eval` required for Next.js App Router bundles |
| Legal routes | `/privacy`, `/personal-data-consent`, `/cookies` in build |
| Sitemap | public + legal only; no `/leads` / API |
| Favicon | redirect `/favicon.ico` → `/icon.svg` |
| Real public PII collection | **disabled** in demo |
| Owner production data | still missing → real-client mode blocked |
| PR-CY / Auditikk | optional supporting only |

**Deploy note:** apply Prisma migration on the target SQLite **before** or with the first start of the new app binary — otherwise Prisma expects new columns that are absent. This review does **not** run production migration.

---

## Final Verdict

**PRE-DEPLOY REVIEW: SAFE TO COMMIT** (local demo compliance release).

**READY FOR DEMO DEPLOY** — after a separate controlled deploy with migration; this review does not deploy.

**READY WITH OWNER ACTIONS** — for any future `SITE_MODE=production` with real lead storage.

Not “legally compliant” as a legal conclusion.
