# DEPLOY_VPS — публикация СТРОЙДОМ на Linux VPS

Инструкция для развёртывания на чистом Ubuntu 22.04 / 24.04.  
Docker не требуется: Node.js + systemd + Nginx.

> **Статус:** живой production развёрнут по Beget-сценарию — см. [`DEPLOY_BEGET.md`](./DEPLOY_BEGET.md).  
> Этот файл остаётся общей инструкцией. Домены в примерах — `example.com`.

> Это общий вариант для любого Linux VPS. Пошаговый проход именно по Beget Cloud —
> от создания сервера в панели до HTTPS — в [`DEPLOY_BEGET.md`](./DEPLOY_BEGET.md).
> Архитектура у обоих документов одна: systemd + Nginx + Node.js + SQLite.

---

## 1. Требования

| Компонент | Версия / примечание |
|-----------|---------------------|
| Node.js | LTS (20.x или 22.x) |
| npm | идёт вместе с Node |
| Nginx | reverse proxy + TLS |
| Certbot | Let's Encrypt сертификат |
| systemd | автозапуск сервиса |
| sqlite3 (CLI) | безопасный онлайн-backup базы |
| git | опционально, если деплой через репозиторий |

PostgreSQL, Docker и CI/CD на этом этапе не нужны.

---

## 2. Структура каталогов

| Путь | Назначение |
|------|------------|
| `/opt/stroydom` | код приложения (пересоздаётся при обновлении) |
| `/var/lib/stroydom/stroydom.db` | SQLite база (**persistent**, не трогать при деплое) |
| `/var/backups/stroydom` | резервные копии базы |
| journald | логи приложения (`journalctl -u stroydom`) |

**Важно:** база лежит вне `/opt/stroydom`, поэтому обновление кода не может её удалить.

---

## 3. Отдельный пользователь

Приложение не должно постоянно работать под root.

```bash
sudo adduser --system --group --home /opt/stroydom stroydom

sudo mkdir -p /opt/stroydom /var/lib/stroydom /var/backups/stroydom
sudo chown -R stroydom:stroydom /opt/stroydom /var/lib/stroydom /var/backups/stroydom
sudo chmod 750 /var/lib/stroydom
```

---

## 4. Установка окружения

```bash
sudo apt update && sudo apt upgrade -y

# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# sqlite3 CLI — обязателен для безопасного онлайн-backup базы
sudo apt install -y sqlite3

node -v && npm -v && sqlite3 --version
```

---

## 5. Первичный деплой

```bash
# 1. Загрузить код (git clone или rsync) в /opt/stroydom
sudo -u stroydom git clone <REPO_URL> /opt/stroydom
cd /opt/stroydom

# 2. Зависимости строго из lock-файла
sudo -u stroydom npm ci

# 3. Переменные окружения
sudo -u stroydom cp .env.production.example .env
sudo -u stroydom nano .env          # заполнить реальные значения
sudo chmod 600 /opt/stroydom/.env

# 4. Prisma
sudo -u stroydom npx prisma generate
sudo -u stroydom npx prisma migrate deploy

# 5. Сборка
sudo -u stroydom npm run build
```

`.env` минимум:

```env
DATABASE_URL="file:/var/lib/stroydom/stroydom.db"
NEXT_PUBLIC_SITE_URL=https://ВАШ-ДОМЕН
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
CRM_PASSWORD=...
CRM_SESSION_SECRET=...   # openssl rand -base64 32
```

> `NEXT_PUBLIC_SITE_URL` влияет на OpenGraph, canonical и sitemap,  
> а также включает индексацию публичной страницы.

**Только `prisma migrate deploy`.** `prisma migrate dev` в production запускать нельзя — он создаёт новые миграции и может пересоздать базу.

---

## 6. systemd

```bash
sudo cp /opt/stroydom/deploy/stroydom.service.example /etc/systemd/system/stroydom.service
sudo systemctl daemon-reload
sudo systemctl enable --now stroydom
sudo systemctl status stroydom
journalctl -u stroydom -f
```

Приложение слушает `127.0.0.1:3000` — наружу порт не открывается.

Проверка локально на сервере:

```bash
curl -s http://127.0.0.1:3000/api/health
# {"status":"ok"}
```

---

## 7. Nginx

```bash
sudo cp /opt/stroydom/deploy/nginx-stroydom.example.conf /etc/nginx/sites-available/stroydom
sudo nano /etc/nginx/sites-available/stroydom     # заменить example.com
sudo ln -s /etc/nginx/sites-available/stroydom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Схема: `80/443 (Nginx)` → `127.0.0.1:3000 (Next.js)`.

Firewall:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 8. Домен и HTTPS

1. A-запись домена → IP сервера, дождаться распространения DNS.
2. Выпустить сертификат:

```bash
sudo certbot --nginx -d ВАШ-ДОМЕН -d www.ВАШ-ДОМЕН
sudo systemctl status certbot.timer     # автопродление
```

3. После выпуска убедиться, что `NEXT_PUBLIC_SITE_URL` в `.env` содержит `https://`, и перезапустить:

```bash
sudo -u stroydom npm run build --prefix /opt/stroydom
sudo systemctl restart stroydom
```

---

## 9. Обновление приложения

> Обычный `cp` работающей SQLite-базы может дать повреждённую копию:
> файл пишется в момент копирования. Поэтому backup делается либо
> командой `sqlite3 .backup` (корректна на живой базе), либо обычным `cp`,
> но **только после** остановки сервиса.

```bash
# 1. Backup базы ДО обновления — онлайн-backup на работающем сервисе
sudo -u stroydom sqlite3 /var/lib/stroydom/stroydom.db \
  ".backup '/var/backups/stroydom/stroydom-$(date +%F-%H%M).db'"

# 1a. Убедиться, что копия целая, и только потом продолжать
sudo -u stroydom sqlite3 /var/backups/stroydom/stroydom-*.db "PRAGMA integrity_check;"

# 2. Остановить сервис (только после успешного backup)
sudo systemctl stop stroydom

# 3. Обновить код
cd /opt/stroydom && sudo -u stroydom git pull

# 4-7. Пересобрать
sudo -u stroydom npm ci
sudo -u stroydom npx prisma generate
sudo -u stroydom npx prisma migrate deploy
sudo -u stroydom npm run build

# 8. Запустить
sudo systemctl start stroydom

# 9-10. Проверить
curl -s http://127.0.0.1:3000/api/health
curl -sI https://ВАШ-ДОМЕН | head -n 1
```

Альтернатива без `sqlite3` — backup при остановленном сервисе:

```bash
sudo systemctl stop stroydom
sudo -u stroydom cp /var/lib/stroydom/stroydom.db \
  /var/backups/stroydom/stroydom-$(date +%F-%H%M).db
# ... обновление кода и сборка ...
sudo systemctl start stroydom
```

---

## 10. Backup и восстановление SQLite

**Где база:** `/var/lib/stroydom/stroydom.db`

**Основной способ — онлайн-backup через `sqlite3 .backup`.** Он корректно работает
на активно записываемой базе, поэтому останавливать сервис не нужно:

```bash
sudo -u stroydom sqlite3 /var/lib/stroydom/stroydom.db \
  ".backup '/var/backups/stroydom/stroydom-$(date +%F-%H%M).db'"
```

Проверка целостности копии:

```bash
sudo -u stroydom sqlite3 /var/backups/stroydom/stroydom-YYYY-MM-DD-HHMM.db \
  "PRAGMA integrity_check;"      # ожидается: ok
```

Обычный `cp` допустим **только при остановленном сервисе**:

```bash
sudo systemctl stop stroydom
sudo -u stroydom cp /var/lib/stroydom/stroydom.db \
  /var/backups/stroydom/stroydom-$(date +%F-%H%M).db
sudo systemctl start stroydom
```

Копировать `.db` обычным `cp` на работающем приложении нельзя: рядом существуют
WAL/journal-файлы, и копия может оказаться повреждённой.

Ежедневный cron (03:30) с хранением 14 дней:

```cron
30 3 * * * sqlite3 /var/lib/stroydom/stroydom.db ".backup '/var/backups/stroydom/stroydom-$(date +\%F).db'" && find /var/backups/stroydom -name 'stroydom-*.db' -mtime +14 -delete
```

Восстановление:

```bash
sudo systemctl stop stroydom
sudo -u stroydom cp /var/backups/stroydom/stroydom-YYYY-MM-DD.db \
  /var/lib/stroydom/stroydom.db
sudo systemctl start stroydom
```

---

## 11. Обязательный тест после публикации

### 11.1 Публичная форма

1. Открыть `https://ВАШ-ДОМЕН`.
2. Заполнить калькулятор (площадь, этажи, материал, комплектация).
3. Отправить заявку.
4. Увидеть сообщение об успехе.
5. Получить уведомление в Telegram.
6. Войти в `/leads`.
7. Увидеть заявку в списке.
8. Сменить статус `Новая` → `Связались`.
9. Выйти и войти снова.

### 11.2 UTM

Открыть:

```
https://ВАШ-ДОМЕН/?utm_source=yandex&utm_medium=cpc&utm_campaign=test
```

Отправить заявку → в карточке заявки в CRM должны быть `utm_source`, `utm_medium`, `utm_campaign`.

### 11.3 Безопасность CRM

| Проверка | Ожидание |
|----------|----------|
| `/leads` без входа | redirect на `/leads/login` |
| `GET /api/leads` без cookie | `401` |
| поддельная cookie `crm_session` | `401` |
| неверный пароль | `401` |
| много неудачных входов подряд | `429` |
| `/api/health` | `200 {"status":"ok"}` |

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ВАШ-ДОМЕН/api/leads
curl -s -o /dev/null -w "%{http_code}\n" -H "Cookie: crm_session=fake.token" \
  https://ВАШ-ДОМЕН/api/leads
```

---

## 12. Чего не делать

- не запускать `npm run dev` в production;
- не открывать порт 3000 наружу;
- не запускать `prisma migrate dev` / `prisma migrate reset` на сервере;
- не запускать `npm run db:clear-leads` и `npm run db:seed-demo` в production;
- не хранить базу внутри `/opt/stroydom`;
- не коммитить `.env`.
