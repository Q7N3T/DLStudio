import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import StudioModule from "../modules/studio"

/** Много товаров → одна студия. В query: product.studio, studio.products. */
export default defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  StudioModule.linkable.studio
)
