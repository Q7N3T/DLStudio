import { writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Записывает токен публичного API-ключа (pk_...) в файл, чтобы витрина в Docker
 * получила NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY без ручного копирования из админки.
 *
 *   medusa exec ./src/scripts/write-publishable-key.ts [путь]
 *
 * Путь по умолчанию — PUBLISHABLE_KEY_FILE или /shared/publishable-key.
 * Публичный ключ не секрет: он виден в браузере и лишь ограничивает запросы каналом продаж.
 */
export default async function writePublishableKey({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const target = args[0] || process.env.PUBLISHABLE_KEY_FILE || "/shared/publishable-key"

  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "type", "revoked_at", "created_at"],
    filters: { type: "publishable" },
  })

  const key = keys
    .filter((k) => !k.revoked_at)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0]

  if (!key?.token) {
    logger.error("Публичный API-ключ не найден. Сначала выполните `medusa db:migrate`.")
    process.exitCode = 1
    return
  }

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, key.token, { encoding: "utf8" })
  logger.info(`Публичный API-ключ записан в ${target}`)
}
