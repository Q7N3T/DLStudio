# Образ для локальной разработки: Node + системные утилиты.
# Исходники монтируются томом, node_modules живут в именованных томах
# (бинарники под Linux не смешиваются с macOS-зависимостями на хосте).
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates postgresql-client socat \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1 \
  MEDUSA_DISABLE_TELEMETRY=true \
  npm_config_update_notifier=false \
  npm_config_fund=false \
  npm_config_audit=false

WORKDIR /app
