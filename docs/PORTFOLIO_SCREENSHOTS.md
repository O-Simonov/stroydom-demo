# PORTFOLIO SCREENSHOTS — STROYDOM

Связанный рабочий файл съёмки: [`../SCREENSHOTS.md`](../SCREENSHOTS.md).  
Файлы: `docs/screenshots/*.png`.  
Автосъёмка публичных кадров: `npm run portfolio:screenshots` (Playwright). CRM — **только local demo DB**, не production.

## PRIMARY PORTFOLIO IMAGE

**Файл:** `docs/screenshots/01-home-desktop.png`  
**Кадр:** desktop hero главной (`/`, ~1440×1000)  
**Почему:** сразу читаются бренд, оффер, CTA и уровень визуала; один кадр продаёт «это готовый сайт», а не только CRM или форма.

Запасной акцент для «full-stack»: `06-crm-desktop.png` (local demo, без реальных ПДн).

---

## План кадров

### DESKTOP

| ID | URL | Viewport | В кадре | Зачем | ПДн |
| --- | --- | --- | --- | --- | --- |
| 01-home-hero | `/` top | 1440×900 | Hero, бренд, CTA | Карточка кейса | Нет |
| 02-services / benefits | `/#benefits` | 1440×900 | Блок преимуществ | UX секций | Нет |
| 03-projects | `/#projects` | 1440×900 | Проекты домов | Контент витрины | Нет |
| 04-parameters | `/#calculator` | 1440×900 | Подбор параметров | Product feature | Не Submit |
| 05-lead-form | `/#contact` | 1440×900 | Форма + demo disclosure | Лидогенерация | Только вымышленные значения; **не отправлять**, если не нужен demo API smoke |
| 06-footer | `/` bottom | 1440×900 | Footer + legal links | Завершённость | Нет |
| 07-crm-login | `/leads/login` | 1440×900 | Экран входа, поле пароля пустое | Auth | Не вводить пароль на снимке |
| 08-crm-leads | `/leads` | 1440×900 | Таблица + статусы | CRM | **Только local seed**; без реальных ПДн |
| 09-crm-lead-detail | `/leads` + detail | 1440×900 | Карточка лида | CRM depth | Local seed only |
| 10-privacy | `/privacy` | 1440×900 | Политика / demo notes | Compliance angle | Нет |

### MOBILE

| ID | URL | Viewport | В кадре | Зачем | ПДн |
| --- | --- | --- | --- | --- | --- |
| 11-mobile-hero | `/` | 390×844 | Hero + CTA | Mobile first | Нет |
| 12-mobile-services | `/#benefits` или projects | 390×844 | Секция без гориз. скролла | Responsive | Нет |
| 13-mobile-form | `/#contact` | 390×844 | Форма | Mobile lead UX | Не Submit / synthetic |
| 14-mobile-menu | `/` + open menu | 390×844 | Навигация | UX | Нет |
| 15-mobile-footer | footer | 390×844 | Footer | Completeness | Нет |
| (есть) 08-crm-mobile | `/leads` local | 390×844 | Карточки CRM | CRM mobile | Local seed |

---

## Уже снято (DONE)

| Файл | Соответствие плану |
| --- | --- |
| `01-home-desktop.png` | 01-home-hero |
| `02-parameters-desktop.png` | 04-parameters |
| `03-form-desktop.png` | 05-lead-form |
| `04-home-mobile.png` | 11-mobile-hero |
| `05-form-mobile.png` | 13-mobile-form |
| `06-crm-desktop.png` | 08-crm-leads (local) |
| `07-crm-details.png` | 09-crm-lead-detail (local) |
| `08-crm-mobile.png` | CRM mobile (local) |

## MANUAL / OPTIONAL досъёмка

02 benefits, 03 projects, 06 footer, 07 crm-login, 10 privacy, 12 mobile services, 14 mobile menu, 15 mobile footer.

---

## HOW TO CAPTURE PORTFOLIO SCREENSHOTS

1. Масштаб браузера 100%, светлая тема, без расширений поверх UI.  
2. Desktop DevTools device toolbar off; окно ≈ 1440×900+.  
3. Mobile: 390×844.  
4. Публичные URL: `https://stroydom-project.ru…`  
5. CRM: только `npm run dev` + `db:seed-demo` локально. **Не** логиниться в production CRM для скриншотов с реальными лидами.  
6. Не показывать `.env`, пароли, токены, реальные ФИО/телефоны.  
7. Имена файлов — стабильные kebab-case PNG в `docs/screenshots/`.  
8. Либо: `npm run portfolio:screenshots` для публичного набора по скрипту.
