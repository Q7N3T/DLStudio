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

## Данные магазина (сид)

При первом `medusa db:migrate` на пустой базе выполняется [`initial-data-seed`](backend/src/migration-scripts/initial-data-seed.ts)
(логика — [`backend/src/lib/seed/`](backend/src/lib/seed)):

| Что | Значение |
| --- | --- |
| Магазин | «DL Studio», валюта ₽ по умолчанию, цены с учётом налогов |
| Регион | «Россия» (`ru`, RUB), политики доставки и возврата в метаданных региона |
| Склады | «Склад в Москве» (товары «Из России», остались единичные размеры) и «Склад в Китае (Гуанчжоу)» (под заказ) |
| Доставка | СДЭК 490 ₽ (3–7 дней) и Почта России 390 ₽ (7–14 дней), бесплатно от 15 000 ₽ |
| Каталог | Снимок dlstudio.store: 72 реальных товара, 50 категорий (слаги сайта), 18 студий, 5 коллекций, релизы — тегами |
| Остатки | Китай — 50 шт. на вариацию (под заказ); Москва — 1 шт. оставшихся размеров; распроданные — 0 |
| Цены | Цены с сайта; прайс-лист «Распродажа» для товаров со скидкой; промокод **AUTUMN** — −10% на заказ |

### Снимок каталога

Товары берутся из [`backend/src/lib/seed/data/dlstudio-snapshot.json`](backend/src/lib/seed/data/dlstudio-snapshot.json).
Его делает [`tools/snapshot-dlstudio.mjs`](tools/snapshot-dlstudio.mjs) — только чтение публичного WooCommerce Store API,
без ключей и без записи:

```bash
node tools/snapshot-dlstudio.mjs            # 72 товара: оба склада, все разделы, скидки, распроданное
node tools/snapshot-dlstudio.mjs --limit 120
```

Что сохраняется по каждому товару: название, тип, студия, категории, подборки и релизы, цены и скидка,
цвета и размеры (по существующим вариациям), фото (ссылки на dlstudio.store) и **нижняя часть карточки**,
разобранная из HTML описания по блокам. В Medusa она лежит в `product.metadata.details`:

| Поле | Что внутри | Пример |
| --- | --- | --- |
| `season` | сезон коллекции | «Коллекция осень-зима 2025» |
| `size_chart` | таблица замеров: `columns` и `rows` | Грудь / Плечи / Рукав / Длина по размерам; у обуви — EU / US / см |
| `size_chart_note` | подсказка к таблице | «Выбирайте исходя из цифр, а не из букв…» |
| `model_params` | параметры моделей на фото | «Парень – 175 см / 60 кг. Верх М, низ M.» |
| `composition` | состав, по строке на часть | «Верх: натуральная кожа.», «Подошва: резина + EVA» |
| `care` | уход | «Машинная стирка при 30°С…» |
| `temperature` | температурный режим верхней одежды | «ориентировочно от +10 до 0 °C» |
| `features` | прочие характеристики | `{ label: "Высота каблука", value: "2 см" }` |

Обычный текст описания — в `product.description`. Тип доставки — в `product.metadata.delivery_origin`
(`china` / `russia`), он совпадает со складом, где лежит остаток. Handle товара = слаг на сайте,
поэтому адреса `/product/<slug>/` сохраняются.

Пересоздать данные с нуля:

```bash
docker compose down && docker volume rm dlstudio_pgdata dlstudio_redisdata && docker compose up -d
```

### Свои модули бэкенда

- **Студии** — [`backend/src/modules/studio`](backend/src/modules/studio): модель `studio` (название, handle, описание,
  логотип, обложка) и связь «много товаров → одна студия» ([`links/product-studio.ts`](backend/src/links/product-studio.ts)).
  В запросах доступно как `product.studio` и `studio.products`.
- **Доставка СДЭК / Почта России** — [`backend/src/modules/dlstudio-shipping`](backend/src/modules/dlstudio-shipping):
  провайдер-заглушка (`dlstudio-shipping_stub`) с фиксированными тарифами из [`tariffs.ts`](backend/src/modules/dlstudio-shipping/tariffs.ts).
  Цена считается провайдером, поэтому порог бесплатной доставки (`FREE_SHIPPING_THRESHOLD`) учитывается при каждом
  пересчёте корзины. Для реального API достаточно заменить `calculatePrice` и `createFulfillment`.

### Админка на русском

Язык админки выбирается у каждого пользователя: **Settings → Profile → Language → Русский**.

### Colima: горячая перезагрузка

По умолчанию Colima не пробрасывает в виртуальную машину события изменения файлов — Next.js и Medusa
в контейнерах не видят правок. Включите `mountInotify` и перезапустите Colima:

```bash
sed -i '' 's/^mountInotify: false/mountInotify: true/' ~/.colima/default/colima.yaml && colima restart
```

### VPN и картинки в dev

VPN с fake-IP DNS (Clash, sing-box и т.п.) резолвит dlstudio.store в `198.18.x`, а Next 16 по умолчанию не
оптимизирует картинки с таких адресов. Поэтому в `docker-compose.yml` для витрины задано
`NEXT_IMAGE_ALLOW_LOCAL_IP=true` — только для разработки; в продакшене защита остаётся включённой.

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
| `FREE_SHIPPING_THRESHOLD` | backend | Бесплатная доставка от этой суммы, ₽ (по умолчанию 15000; 0 — без порога) |
| `MEDUSA_BACKEND_URL` | backend | Публичный адрес API (ссылки админки) |
| `NEXT_PUBLIC_DEFAULT_REGION` | storefront | Страна по умолчанию (`ru`) |
| `NEXT_PUBLIC_BASE_URL` | storefront | Публичный адрес витрины для canonical, sitemap, OpenGraph |

## Этапы

- [x] **1. Скелет монорепо и docker-compose для разработки**
- [x] **2. Medusa: регион RU, рубли, склады, доставка-заглушка, студии, сиды с тестовыми товарами**
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
