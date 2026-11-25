#!/usr/bin/env sh
# Запуск витрины в dev-контейнере: ждём публичный ключ от бэкенда и стартуем next dev.
set -eu
cd /app/storefront

# В стартере один адрес API (NEXT_PUBLIC_MEDUSA_BACKEND_URL) и для браузера, и для сервера Next.js.
# Браузер ходит на localhost:9000 хоста, а внутри контейнера тот же адрес проксируем на сервис backend.
if [ -n "${BACKEND_UPSTREAM:-}" ]; then
  socat TCP-LISTEN:9000,fork,reuseaddr,bind=127.0.0.1 "TCP:${BACKEND_UPSTREAM}" &
fi

KEY_FILE="${PUBLISHABLE_KEY_FILE:-/shared/publishable-key}"

# Сначала API: бэкенд отвечает на /health только после миграций и записи нового ключа,
# поэтому ключ из общего тома гарантированно свежий (даже после сброса базы).
echo "▸ Жду API бэкенда…"
until curl -fsS "${NEXT_PUBLIC_MEDUSA_BACKEND_URL:-http://localhost:9000}/health" >/dev/null 2>&1; do sleep 2; done

if [ -z "${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:-}" ]; then
  echo "▸ Жду публичный API-ключ от бэкенда ($KEY_FILE)…"
  i=0
  until [ -s "$KEY_FILE" ]; do
    i=$((i + 1))
    if [ "$i" -gt 600 ]; then
      echo "✗ Ключ не появился за 10 минут. Логи бэкенда: docker compose logs backend" >&2
      exit 1
    fi
    sleep 1
  done
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$(cat "$KEY_FILE")"
  export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
fi

echo "▸ next dev на :8000"
exec npm run dev
