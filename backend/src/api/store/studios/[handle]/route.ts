import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/** GET /store/studios/:handle — одна студия по handle (страница студии). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "studio",
    fields: ["id", "name", "handle", "description", "logo_url", "cover_url"],
    filters: { handle: req.params.handle },
  })
  if (!data[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Студия «${req.params.handle}» не найдена`)
  }
  res.json({ studio: data[0] })
}
