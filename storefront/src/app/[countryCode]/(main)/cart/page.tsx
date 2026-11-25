import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { CART_FIELDS, type StockMap } from "@lib/dl/cart"
import { HttpTypes } from "@medusajs/types"
import { CartView } from "@modules/dl/cart/cart-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: false },
}

/** Остатки вариантов из каталога: корзина Medusa их не возвращает */
async function loadStock(cart: HttpTypes.StoreCart | null, countryCode: string): Promise<StockMap> {
  const ids = [...new Set((cart?.items ?? []).map((i) => i.product_id).filter((x): x is string => !!x))]
  if (!ids.length) return {}
  const { response } = await listProducts({
    countryCode,
    queryParams: { id: ids, limit: ids.length } as HttpTypes.StoreProductListParams,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))
  return Object.fromEntries(
    response.products.flatMap((p) => (p.variants ?? []).map((v) => [v.id, v.inventory_quantity ?? null]))
  )
}

export default async function CartPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const cart = await retrieveCart(undefined, CART_FIELDS).catch(() => null)
  const stock = await loadStock(cart, countryCode)
  return <CartView cart={cart} countryCode={countryCode} stock={stock} />
}
