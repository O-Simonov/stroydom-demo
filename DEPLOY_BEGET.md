# DEPLOY_BEGET — публикация СТРОЙДОМ на Beget Cloud VPS

Пошаговая инструкция для одного конкретного сценария: обычный VPS в Beget Cloud,
Ubuntu 24.04 LTS, без Docker и без PM2.

```
Интернет
   ↓  HTTPS :443
Nginx
   ↓  proxy_pass 127.0.0.1:3000
Next.js (next start, systemd)
   ↓
Prisma
   ↓
SQLite  /var/lib/stroydom/stroydom.db
   ↓
Telegram-уведомления + mini-CRM /leads
```

> **Статус:** реальный deploy ещё не выполнялся. Сервер не создан, домен не подключён,
> DNS не менялся. Документ описывает шаги, которые предстоит выполнить.

**Соотношение с другими документами:**

| Документ | Про что |
|----------|---------|
| `DEPLOY_VPS.md` | общая схема «любой Linux VPS + SQLite», справочник по backup и тестам |
| `DEPLOY_BEGET.md` | этот файл: конкретный проход по Beget Cloud от создания сервера до HTTPS |

Оба варианта используют одну и ту же архитектуру: systemd + Nginx + Node.js + SQLite.
PostgreSQL, serverless и Netlify в этом проекте не применяются.

---

## 1. Что нужно подготовить заранее

| Что | Комментарий |
|-----|-------------|
| Аккаунт Beget | с доступом к разделу «Облако» / VPS |
| Созданный VPS | Ubuntu 24.04 LTS (или 22.04 LTS) |
| IP-адрес сервера | выдаётся при создании |
| root или sudo доступ | пароль приходит на почту аккаунта либо SSH-ключ |
| SSH-клиент | встроен в Windows 11, macOS и большинство дистрибутивов Linux |
| Домен | опционально, можно подключить позже |
| `TELEGRAM_BOT_TOKEN` | токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | ID чата, куда бот шлёт уведомления |
| `CRM_PASSWORD` | отдельный пароль для входа в `/leads` |
| `CRM_SESSION_SECRET` | длинная случайная строка для подписи cookie |

Реальные значения секретов в этот документ и в репозиторий не записываются —
они вводятся только в `/opt/stroydom/.env` на сервере.

---

## 2. Рекомендуемая конфигурация сервера

Тяжёлый сервер для этого проекта не нужен.

| Параметр | Минимум для сборки на сервере | Комфортно |
|----------|-------------------------------|-----------|
| RAM | 1 GB + swap | **2 GB** |
| vCPU | 1 | 1–2 |
| Диск | 10 GB | 20+ GB SSD |

На 1 GB RAM `npm run build` может упасть по памяти. Это не блокирует deploy —
в разделе 9 описан обходной путь (swap-файл). На 2 GB сборка проходит спокойно.

---

## 3. Создание сервера в панели Beget

1. Панель управления Beget → раздел «Облако» (VPS).
2. Создать сервер, в списке образов выбрать **Ubuntu 24.04**.
3. Выбрать конфигурацию из раздела 2.
4. Если есть SSH-ключ — добавить его сразу при создании; это надёжнее пароля.
5. Дождаться установки. IP-адрес и строка вида `root@<IP>` появятся в карточке сервера,
   пароль root отправляется на контактную почту аккаунта.

Названия пунктов в панели со временем меняются — ориентируйтесь на раздел с VPS.

---

## 4. Первое подключение

```bash
ssh root@<IP-СЕРВЕРА>
```

Обновить систему и задать часовой пояс:

```bash
apt update && apt upgrade -y
timedatectl set-timezone Europe/Moscow
```

Базовая защита (рекомендуется, но не обязательна для demo): добавить SSH-ключ и
отключить вход по паролю в `/etc/ssh/sshd_config` (`PasswordAuthentication no`),
затем `systemctl restart ssh`.

---

## 5. Установка окружения

Проект собран на Next.js 15.5 и Prisma 6.19. Обоим достаточно Node.js 18.18+,
локальная разработка идёт на Node 24. На сервере ставим **Node.js 22 LTS** —
это поддерживаемая LTS-линия, совместимая с текущими зависимостями.
Node 24 LTS тоже подходит; версии зависимостей проекта менять не нужно.

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx, certbot, git, sqlite3 CLI (нужен для онлайн-backup базы)
sudo apt install -y nginx certbot python3-certbot-nginx git sqlite3

node -v && npm -v && sqlite3 --version
```

---

## 6. Пользователь и каталоги

Приложение не должно постоянно работать под root.

| Путь | Назначение |
|------|------------|
| `/opt/stroydom` | код приложения |
| `/var/lib/stroydom/stroydom.db` | SQLite база — **persistent**, живёт вне кода |
| `/var/backups/stroydom` | резервные копии базы |

```bash
# Системный пользователь без интерактивного входа.
# --no-create-home важен: git clone требует пустой каталог.
sudo adduser --system --group --home /opt/stroydom --no-create-home stroydom

sudo mkdir -p /opt/stroydom /var/lib/stroydom /var/backups/stroydom
sudo chown -R stroydom:stroydom /opt/stroydom /var/lib/stroydom /var/backups/stroydom
sudo chmod 750 /var/lib/stroydom /var/backups/stroydom
```

`chmod 750`, а не `777`: каталог базы доступен только пользователю `stroydom`.
Права на **каталог** обязательны — SQLite создаёт рядом с базой файлы `-journal`
и `-wal`, поэтому приложению нужна запись в саму директорию, а не только в файл.

Проверка, что каталог под клонирование пуст:

```bash
ls -A /opt/stroydom     # пусто — можно клонировать
```

---

## 7. Загрузка кода из GitHub

Репозиторий публичный, токен не нужен:

```bash
sudo -u stroydom git clone https://github.com/O-Simonov/stroydom-demo.git /opt/stroydom
cd /opt/stroydom
```

---

## 8. Зависимости и переменные окружения

`npm ci` ставит строго то, что зафиксировано в `package-lock.json`.
Флаг `-H` у `sudo` обязателен: без него npm попытается писать кэш в домашний каталог
root и упадёт на правах.

```bash
sudo -H -u stroydom npm ci
```

Создать `.env` из шаблона:

```bash
sudo -u stroydom cp /opt/stroydom/.env.production.example /opt/stroydom/.env
sudo -u stroydom nano /opt/stroydom/.env
sudo chmod 600 /opt/stroydom/.env
```

Обязательные значения:

```env
DATABASE_URL="file:/var/lib/stroydom/stroydom.db"
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
CRM_PASSWORD=
CRM_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_METRIKA_ID=
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
```

Сгенерировать секрет подписи cookie прямо на сервере:

```bash
openssl rand -base64 32
```

Полученную строку вписать в `CRM_SESSION_SECRET`. `CRM_PASSWORD` — отдельный пароль,
не переиспользуйте пароль root или токен Telegram.

**Про `NEXT_PUBLIC_SITE_URL`.** Пока тестируете по IP (сценарий A ниже), оставьте
переменную пустой: сайт будет отдавать `noindex, nofollow` и не попадёт в поиск
раньше времени. Заполните её реальным `https://домен` на шаге 12, когда сертификат
уже выпущен, — тогда включатся индексация, canonical, OpenGraph и sitemap.

---

## 9. Prisma и сборка

```bash
cd /opt/stroydom
sudo -H -u stroydom npx prisma generate
sudo -H -u stroydom npx prisma migrate deploy
sudo -H -u stroydom npm run build
```

`migrate deploy` применяет уже существующие миграции из `prisma/migrations` и создаёт
таблицу `Lead` в пустой базе. В production запускать `prisma migrate dev`
или `prisma db push` нельзя — они пересоздают миграции и могут потерять данные.

База создастся автоматически при первой миграции по пути из `DATABASE_URL`.

**Если сборка падает по памяти** (сервер на 1 GB) — добавить swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

После этого повторить `npm run build`. Альтернатива — собрать `.next` локально
и скопировать артефакт на сервер, но для demo-проекта это лишнее усложнение.

---

## 10. systemd

Готовый unit лежит в репозитории:

```bash
sudo cp /opt/stroydom/deploy/stroydom.service.example /etc/systemd/system/stroydom.service
sudo systemctl daemon-reload
sudo systemctl enable --now stroydom
sudo systemctl status stroydom
```

Что задано в unit-файле: `User=stroydom`, `WorkingDirectory=/opt/stroydom`,
`EnvironmentFile=/opt/stroydom/.env`, `ExecStart=npm start` с привязкой к `127.0.0.1:3000`,
`Restart=always`, запись в journald и `ReadWritePaths=/var/lib/stroydom` для записи базы.
`systemctl enable` обеспечивает автозапуск после перезагрузки сервера.

Проверка приложения до Nginx:

```bash
curl -s http://127.0.0.1:3000/api/health
# {"status":"ok"}
```

Логи:

```bash
journalctl -u stroydom -f
```

Секреты в логи не пишутся: приложение логирует только факт ошибки, без значений env
и без connection string.

---

## 11. Сценарий A — проверка по IP, до домена

Готовый конфиг в репозитории рассчитан на домен. Для первой проверки по IP
достаточно временного блока:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/sites-available/stroydom-ip
```

```nginx
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # Заголовки формирует Nginx и перезаписывает их, а не дописывает:
        # клиент не должен уметь подделать свой IP для rate limit.
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stroydom-ip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -s http://<IP-СЕРВЕРА>/api/health
```

Firewall — наружу открыты только SSH и Nginx, порт 3000 остаётся на loopback:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 12. Сценарий B — домен и HTTPS

1. **DNS.** Если домен обслуживается в Beget, в разделе DNS создать A-запись
   `@` → IP сервера и, при необходимости, `www` → IP сервера. Дождаться
   распространения (`nslookup ВАШ-ДОМЕН`).

2. **Основной конфиг Nginx** вместо временного:

```bash
sudo rm -f /etc/nginx/sites-enabled/stroydom-ip
sudo cp /opt/stroydom/deploy/nginx-stroydom.example.conf /etc/nginx/sites-available/stroydom
sudo nano /etc/nginx/sites-available/stroydom     # заменить example.com на реальный домен
sudo ln -s /etc/nginx/sites-available/stroydom /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

В этом конфиге уже есть `proxy_pass http://127.0.0.1:3000`, корректные `Host`,
`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` и `X-Robots-Tag: noindex`
для `/leads`.

3. **Сертификат** — только для реального домена, который уже указывает на сервер:

```bash
sudo certbot --nginx -d ВАШ-ДОМЕН -d www.ВАШ-ДОМЕН
sudo systemctl status certbot.timer      # автопродление
```

4. **Включить публичный URL** в `/opt/stroydom/.env`:

```env
NEXT_PUBLIC_SITE_URL=https://ВАШ-ДОМЕН
```

Значение попадает в клиентский бандл, поэтому нужна пересборка:

```bash
cd /opt/stroydom
sudo -H -u stroydom npm run build
sudo systemctl restart stroydom
curl -s https://ВАШ-ДОМЕН/api/health
```

---

## 13. Приёмочные тесты после публикации

### 13.1 Публичная форма

1. Открыть сайт.
2. Выбрать параметры дома в калькуляторе: площадь, этажность, материал, комплектацию.
3. Нажать «Получить расчёт», заполнить имя и телефон.
4. Отправить заявку → ответ `201`, на экране сообщение об успехе.
5. Проверить, что пришло уведомление в Telegram.
6. Открыть `/leads` и убедиться, что заявка появилась в CRM.

### 13.2 CRM

| Проверка | Ожидание |
|----------|----------|
| `/leads` без сессии | redirect на `/leads/login` |
| неверный пароль | `401` |
| верный пароль | вход выполнен, заявка видна |
| смена статуса `NEW` → `CONTACTED` | статус сохраняется после перезагрузки |
| logout | `/leads` снова требует вход |
| `GET /api/leads` без cookie | `401` |
| `/api/health` | `200 {"status":"ok"}` |

### 13.3 Telegram

Достаточно одного успешного уведомления. Разрушающий тест с заведомо неверным
токеном на production не нужен — поведение при сбое Telegram уже проверено локально:
заявка сохраняется и возвращает `201` даже если уведомление не ушло.

---

## 14. Обновление после нового коммита

```bash
# 1. Backup базы ДО обновления, на работающем сервисе
sudo -u stroydom sqlite3 /var/lib/stroydom/stroydom.db \
  ".backup '/var/backups/stroydom/stroydom-$(date +%F-%H%M).db'"

# 2. Обновление кода — только fast-forward, без reset и force
cd /opt/stroydom
sudo -u stroydom git fetch origin
sudo -u stroydom git pull --ff-only origin main

# 3. Зависимости, Prisma, сборка
sudo -H -u stroydom npm ci
sudo -H -u stroydom npx prisma generate
sudo -H -u stroydom npx prisma migrate deploy
sudo -H -u stroydom npm run build

# 4. Перезапуск и проверка
sudo systemctl restart stroydom
sudo systemctl status stroydom
curl -s http://127.0.0.1:3000/api/health
```

---

## 15. Backup SQLite

Основной способ — онлайн-backup средствами `sqlite3`, он корректен на работающей базе:

```bash
sudo -u stroydom sqlite3 /var/lib/stroydom/stroydom.db \
  ".backup '/var/backups/stroydom/stroydom-$(date +%F-%H%M).db'"

# проверка копии, ожидается: ok
sudo -u stroydom sqlite3 /var/backups/stroydom/stroydom-YYYY-MM-DD-HHMM.db "PRAGMA integrity_check;"
```

Обычный `cp` активно записываемой базы может дать повреждённую копию из-за
WAL/journal-файлов, поэтому как основной способ он не годится — только при
остановленном сервисе.

Ежедневный backup в 03:30 с хранением 14 дней:

```cron
30 3 * * * sqlite3 /var/lib/stroydom/stroydom.db ".backup '/var/backups/stroydom/stroydom-$(date +\%F).db'" && find /var/backups/stroydom -name 'stroydom-*.db' -mtime +14 -delete
```

Восстановление:

```bash
sudo systemctl stop stroydom
sudo -u stroydom cp /var/backups/stroydom/stroydom-YYYY-MM-DD.db /var/lib/stroydom/stroydom.db
sudo systemctl start stroydom
```

---

## 16. Демо-данные

Production-база стартует пустой. Скрипты `npm run db:seed-demo` и
`npm run db:clear-leads` предназначены только для локальной разработки и
отказываются работать при `NODE_ENV=production`, поэтому в составе deploy их
запускать не нужно и не получится.

---

## 17. Чего не делать

- не запускать `npm run dev` на сервере;
- не открывать порт 3000 наружу — только `127.0.0.1:3000` за Nginx;
- не выполнять `prisma migrate dev`, `prisma migrate reset`, `prisma db push`;
- не хранить базу внутри `/opt/stroydom` — обновление кода её не должно затрагивать;
- не делать `git reset --hard` / `git pull --force` на сервере;
- не коммитить `.env` и не передавать секреты в репозиторий;
- не ставить `chmod 777` на каталог базы;
- не выпускать сертификат для домена, который ещё не указывает на сервер.
