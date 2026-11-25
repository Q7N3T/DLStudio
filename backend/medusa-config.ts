import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL

/**
 * Инфраструктурные модули на Redis (события, workflow, блокировки).
 * Без REDIS_URL Medusa использует встроенные in-memory реализации —
 * так бэкенд можно запустить и без Docker, но только в одном процессе.
 */
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    ...redisModules,
    // Студии (бренды) — свой модуль, связан с товарами (src/links/product-studio.ts)
    { resolve: "./src/modules/studio" },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          // Ручная доставка оставлена для самовывоза и служебных отправлений
          { resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" },
          // СДЭК / Почта России: заглушка с фиксированными тарифами → provider_id "dlstudio-shipping_stub"
          {
            resolve: "./src/modules/dlstudio-shipping",
            id: "stub",
            options: {
              free_shipping_threshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 15000),
            },
          },
        ],
      },
    },
  ],
})
