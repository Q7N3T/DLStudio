#!/usr/bin/env bash
# Деплой витрины на сервер одной командой: npm run deploy
#
# Что делает:
#   1. Локально: проверка типов, линтер, тесты (пропустить: SKIP_CHECKS=1).
#   2. rsync файлов проекта на сервер (без node_modules, .next, .git, локальных env).
#   3. На сервере: npm ci, сборка; если сборка упала — старая версия продолжает работать.
#   4. pm2 restart и проверка, что сайт отвечает 200.
#
# Настройки через переменные окружения:
#   DEPLOY_HOST   SSH-хост из ~/.ssh/config         (по умолчанию nl)
#   DEPLOY_PATH   папка проекта на сервере          (по умолчанию /var/www/site)
#   DEPLOY_APP    имя процесса pm2                  (по умолчанию dlstudio)
#   DEPLOY_PORT   порт приложения на 127.0.0.1      (по умолчанию 3000)
set -euo pipefail

HOST="${DEPLOY_HOST:-nl}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/site}"
APP="${DEPLOY_APP:-dlstudio}"
PORT="${DEPLOY_PORT:-3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

step() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }

cd "$ROOT"

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "⚠ Есть незакоммиченные изменения — они тоже уедут на сервер."
fi
echo "Ветка: $(git rev-parse --abbrev-ref HEAD 2>/dev/null) @ $(git rev-parse --short HEAD 2>/dev/null)"

if [[ "${SKIP_CHECKS:-0}" != "1" ]]; then
  step "Проверки: типы, линтер, тесты"
  npm run --silent typecheck
  npm run --silent lint
  npm test --silent
fi

step "Заливаю файлы на $HOST:$REMOTE_PATH"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .claude \
  --exclude '.env*.local' --exclude '*.tsbuildinfo' \
  --exclude playwright-report --exclude test-results \
  ./ "$HOST:$REMOTE_PATH/"

step "Собираю на сервере и перезапускаю"
ssh "$HOST" bash -s -- "$REMOTE_PATH" "$APP" "$PORT" <<'REMOTE'
set -euo pipefail
cd "$1"
export NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
npm ci --no-audit --no-fund --include=dev --loglevel=error
npm run build
if pm2 describe "$2" >/dev/null 2>&1; then
  pm2 restart "$2" --update-env >/dev/null
else
  pm2 start node_modules/next/dist/bin/next --name "$2" -- start -H 127.0.0.1 -p "$3" >/dev/null
  pm2 save >/dev/null
fi
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$3/" || true)
  [[ "$code" == "200" ]] && { echo "✓ Сайт отвечает 200"; exit 0; }
  sleep 1
done
echo "✗ Сайт не ответил 200 за 20 секунд. Логи: ssh <host> pm2 logs $2 --lines 50" >&2
exit 1
REMOTE

step "Готово"
