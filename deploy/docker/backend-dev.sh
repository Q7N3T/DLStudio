#!/usr/bin/env sh
# Запуск бэкенда в dev-контейнере:
#   1) ждём Postgres, 2) миграции (+ начальный сид при первом запуске),
#   3) админ-пользователь, 4) публичный ключ для витрины, 5) medusa develop.
set -eu
cd /app/backend

KEY_FILE="${PUBLISHABLE_KEY_FILE:-/shared/publishable-key}"
# Старый ключ мог остаться в томе после сброса базы — удаляем, чтобы витрина дождалась нового
rm -f "$KEY_FILE"

echo "▸ Жду PostgreSQL…"
until pg_isready -d "$DATABASE_URL" -q; do sleep 1; done

echo "▸ Миграции"
npx medusa db:migrate

if [ -n "${MEDUSA_ADMIN_EMAIL:-}" ] && [ -n "${MEDUSA_ADMIN_PASSWORD:-}" ]; then
  echo "▸ Админ-пользователь ${MEDUSA_ADMIN_EMAIL}"
  # Повторный запуск падает, если пользователь уже есть, — это нормально
  npx medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" >/dev/null 2>&1 \
    && echo "  создан" || echo "  уже существует"
fi

echo "▸ Публичный API-ключ для витрины"
npx medusa exec ./src/scripts/write-publishable-key.ts "$KEY_FILE"

echo "▸ medusa develop на :9000 (админка: http://localhost:9000/app)"
exec npx medusa develop
