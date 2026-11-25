import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/studios/:handle — студия по handle и ID её опубликованных товаров
 * (страница студии и блок «Ещё от этой студии»; сами товары витрина берёт из /store/products?id=…).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "studio",
    fields: ["id", "name", "handle", "description", "logo_url", "cover_url", "products.id", "products.status"],
    filters: { handle: req.params.handle },
  })
  const studio = data[0]
  if (!studio) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Студия «${req.params.handle}» не найдена`)
  }
  const { products, ...rest } = studio
  res.json({
    studio: {
      ...rest,
      product_ids: (products ?? [])
        .filter((p): p is NonNullable<typeof p> => !!p && p.status === "published")
        .map((p) => p.id),
    },
  })
}
