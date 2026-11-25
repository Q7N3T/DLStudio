# DL Studio

Интернет-магазин бренда одежды **DL Studio** ([dlstudio.store](https://dlstudio.store)): одежда, обувь и аксессуары
независимых китайских студий напрямую от производителей. Портфолио-проект: headless-коммерция на
**Medusa v2** и витрина на **Next.js**.

> Предыдущая версия — headless-витрина поверх WooCommerce Store API — сохранена в ветке и теге
> [`woo-headless`](https://github.com/Q7N3T/DLStudio/tree/woo-headless). Её дизайн-система и компоненты
> переносятся в эту витрину на этапе 3.

## Архитектура

```
  браузер ──▶ :8000  storefront (Next.js)  ── JS SDK ──▶  backend (Medusa v2) :9000
                                                            ├─ Store API   /store/*
  админ   ──▶ :9000/app ───────────────────────────────────▶├─ Admin API   /admin/*
                                                            └─ Admin (React)
                                     postgres:17 ◀──────────┤  данные
                                     redis:7     ◀──────────┘  события, workflow, блокировки
```

| Каталог | Что внутри |
| --- | --- |
| [`backend/`](backend) | Medusa v2: конфиг, сиды, скрипты; дальше — модули ЮKassa, доставки, Telegram и импорт CSV |
| [`storefront/`](storefront) | Next.js на базе официального Medusa Next.js Starter |
| [`deploy/`](deploy) | Dockerfile и скрипты запуска для разработки; продакшен-compose, nginx и HTTPS — на этапе 7 |
| [`docker-compose.yml`](docker-compose.yml) | Локальное окружение: postgres, redis, backend, storefront |

Монорепо на npm workspaces + [Turborepo](https://turbo.build). Стек: Node 22.22+ (в образах — Node 24),
TypeScript, PostgreSQL 17, Redis 7, Tailwind CSS.

## Быстрый старт (Docker)

Нужны Docker с Compose v2 (на macOS подойдёт [Colima](https://github.com/abiosoft/colima)).

```bash
cp .env.example .env      # необязательно: без .env используются dev-значения по умолчанию
docker compose up --build
```

Первый запуск занимает несколько минут: ставятся зависимости, выполняются миграции и начальный сид.

| Что | Адрес |
| --- | --- |
| Витрина | http://localhost:8000 |
| API | http://localhost:9000 (`/health` — проверка) |
| Админка | http://localhost:9000/app — `admin@dlstudio.local` / `supersecret` (меняется в `.env`) |

Что происходит при запуске:

1. `deps` ставит зависимости в Docker-тома (под Linux, отдельно от `node_modules` на хосте) — повторно только при изменении `package-lock.json`.
2. `backend` ждёт Postgres, выполняет `medusa db:migrate` (при первом запуске — начальный сид), создаёт пользователя админки, записывает публичный API-ключ в общий том и запускает `medusa develop`.
3. `storefront` берёт публичный ключ из общего тома, ждёт API и запускает `next dev`. Витрина работает в сетевом пространстве бэкенда, поэтому `http://localhost:9000` одинаково доступен браузеру и серверному коду Next.js.

Полезные команды:

```bash
docker compose logs -f backend          # логи бэкенда
docker compose exec backend sh          # шелл в контейнере бэкенда
docker compose down                     # остановить (данные сохраняются)
docker compose down -v                  # остановить и удалить базу, Redis и зависимости
```

### Если Docker не скачивает образы (Colima)

Ошибка вида `lookup registry-1.docker.io on [::1]:53: connection refused` означает, что в виртуальной машине
Colima не работает DNS. Лечится так:

```bash
colima ssh -- sh -c 'sudo rm -f /etc/resolv.conf && printf "nameserver 8.8.8.8\nnameserver 1.1.1.1\n" | sudo tee /etc/resolv.conf && sudo systemctl restart docker'
```

## Запуск приложений без Docker

Postgres и Redis всё равно удобнее держать в Docker:

```bash
docker compose up -d postgres redis
npm install

cp backend/.env.template backend/.env
(cd backend && npx medusa db:migrate && npx medusa user -e admin@dlstudio.local -p supersecret)
(cd backend && npx medusa exec ./src/scripts/write-publishable-key.ts)   # → storefront/.publishable-key

cp storefront/.env.template storefront/.env.local   # вставьте ключ из storefront/.publishable-key
npm run dev                                         # backend :9000 + storefront :8000
```

## Переменные окружения

Все секреты — только через `.env` (в git не попадает). Описание каждой переменной:

- [`.env.example`](.env.example) — для `docker compose` (Postgres, секреты Medusa, CORS, админ, регион витрины);
- [`backend/.env.template`](backend/.env.template) — бэкенд без Docker;
- [`storefront/.env.template`](storefront/.env.template) — витрина без Docker.

| Переменная | Где | Назначение |
| --- | --- | --- |
| `DATABASE_URL` | backend | Postgres. В Docker — с `?sslmode=disable`: иначе Medusa включает SSL для адресов не на localhost и подключение зависает |
| `REDIS_URL` | backend | Redis для событий, workflow и блокировок; без него — in-memory (только один процесс) |
| `JWT_SECRET`, `COOKIE_SECRET` | backend | Секреты сессий; в продакшене — `openssl rand -hex 32` |
| `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` | backend | Разрешённые источники |
| `MEDUSA_ADMIN_EMAIL`, `MEDUSA_ADMIN_PASSWORD` | compose | Пользователь админки, создаётся при первом запуске |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | storefront | Адрес API Medusa |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | storefront | Публичный ключ `pk_…`; в Docker подставляется автоматически |
| `NEXT_PUBLIC_DEFAULT_REGION` | storefront | Страна по умолчанию (на этапе 2 — `ru`) |
| `NEXT_PUBLIC_BASE_URL` | storefront | Публичный адрес витрины для canonical, sitemap, OpenGraph |

## Этапы

- [x] **1. Скелет монорепо и docker-compose для разработки**
- [ ] 2. Medusa: регион RU, рубли, русский язык, склады, сиды с тестовыми товарами
- [ ] 3. Витрина: главная, каталог, карточка товара, корзина, оформление, гостевой заказ, личный кабинет
- [ ] 4. Платёжный провайдер ЮKassa (webhook, тестовый режим)
- [ ] 5. Уведомления о заказах в Telegram
- [ ] 6. Импорт товаров из CSV
- [ ] 7. Продакшен: nginx + HTTPS (Let's Encrypt), production docker-compose
- [ ] 8. GitHub Actions: линт, проверка типов, сборка, деплой на VPS

## Разработка

- Правила для агентов и подсказки по Medusa — [AGENTS.md](AGENTS.md).
- Бэкенд проверяется `@medusajs/eslint-plugin` (`npm run lint`); правила `@medusajs/*` не отключаем — чиним код.
- Тесты бэкенда: `cd backend && npm run test:unit` (интеграционные требуют живую базу).

## Лицензия

Код на базе [Medusa DTC Starter](https://github.com/medusajs/medusa) (MIT, см. [LICENSE](LICENSE)).
