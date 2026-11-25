import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/studios — список студий для витрины (страница «Студии», фильтр каталога).
 * Только публичные поля; товары студии запрашиваются через /store/products.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: studios } = await query.graph({
    entity: "studio",
    fields: ["id", "name", "handle", "description", "logo_url", "cover_url"],
    pagination: { order: { name: "ASC" } },
  })
  res.json({ studios, count: studios.length })
}
