import type { MedusaContainer } from "@medusajs/framework"
import { seedDlStudio } from "../lib/seed/seed-store"

/**
 * Начальный сид DL Studio. Medusa выполняет migration-scripts один раз — при первом
 * `medusa db:migrate` на пустой базе. Пересоздать данные: `docker compose down -v && docker compose up`.
 */
export default async function initial_data_seed({ container }: { container: MedusaContainer }) {
  await seedDlStudio(container)
}
