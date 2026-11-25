# DL Studio — витрина

Headless-фронтенд для [dlstudio.store](https://dlstudio.store) поверх WordPress + WooCommerce (Store API).
Next.js 16 (App Router, Cache Components), TypeScript strict, Tailwind CSS 4, shadcn/ui (Radix), Zustand.

## Запуск

```bash
npm install
cp .env.example .env.local   # по умолчанию CATALOG_PROVIDER=mock
npm run dev                  # http://localhost:3000
```

| Скрипт                            | Что делает                               |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | dev-сервер                               |
| `npm run build` / `start`         | прод-сборка и запуск                     |
| `npm run lint` / `typecheck`      | ESLint, `tsc --noEmit`                   |
| `npm run format` / `format:check` | Prettier (+ сортировка классов Tailwind) |
| `npm test`                        | Vitest (логика)                          |
| `npm run test:e2e`                | Playwright (критический путь)            |

Витрина компонентов во всех состояниях: [`/ui`](http://localhost:3000/ui) (закрыта от индексации).

## Деплой

```bash
npm run deploy
```

Скрипт [`scripts/deploy.sh`](scripts/deploy.sh): проверки (типы, линтер, тесты) → `rsync` на сервер → `npm ci` и сборка
на сервере → `pm2 restart` → проверка, что сайт отвечает 200. Если сборка упала, старая версия продолжает работать.
По умолчанию хост `nl` из `~/.ssh/config`, папка `/var/www/site`, процесс pm2 `dlstudio`; меняется переменными
`DEPLOY_HOST`, `DEPLOY_PATH`, `DEPLOY_APP`, `DEPLOY_PORT`. Пропустить проверки: `SKIP_CHECKS=1 npm run deploy`.

На сервере: Node.js 24, pm2 (автозапуск через systemd), nginx проксирует домен на `127.0.0.1:3000`.

## Структура

```
src/
  app/(shop)/        витрина: шапка, футер, таб-бар
  app/(dev)/ui/      витрина компонентов
  components/ui/     примитивы shadcn/ui (сгенерированы, правятся точечно)
  components/shop/   компоненты магазина: карточка, цена, бейджи, размеры, фильтры…
  components/layout/ шапка, таб-бар, футер
  config/            сроки доставки, навигация, подборки, таблица размеров
  lib/               форматирование цен/дат, доменные типы каталога
  stores/            Zustand: корзина, избранное, настройки (persist в localStorage)
```

## Дизайн-токены

Все значения — CSS-переменные в `src/app/globals.css`, отображённые в тему Tailwind через `@theme inline`.
Акцент `#F26B3A` даёт 2,9:1 на фоне и не проходит WCAG AA, поэтому используется только как декор;
для текста и бейджей — `--brand-strong` `#CE410E` (4,6:1).

## Ограничения

- Запросы на запись (корзина, заказы) в рабочий WooCommerce — только после явного подтверждения владельца
  (`WOO_ALLOW_WRITES=false`).
- Изображения в моках — нейтральные заглушки из `public/placeholders`.
