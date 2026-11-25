import { model } from "@medusajs/framework/utils"

/**
 * Студия (бренд-производитель): 19 Studio, DAZO Studio, HANQIAORIJI…
 * У товара одна студия; у студии — много товаров (см. src/links/product-studio.ts).
 */
const Studio = model.define("studio", {
  id: model.id({ prefix: "stu" }).primaryKey(),
  name: model.text().searchable(),
  /** Слаг для адреса /about-the-studios/<handle> */
  handle: model.text().unique(),
  description: model.text().nullable(),
  logo_url: model.text().nullable(),
  cover_url: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default Studio
