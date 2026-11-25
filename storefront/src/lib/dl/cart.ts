import { HttpTypes } from "@medusajs/types"
import { deliveryOrigin, type DeliveryOrigin } from "./delivery"

/** Поля корзины для страниц корзины и оформления */
export const CART_FIELDS =
  "*items, *items.product, +items.product.metadata, *items.variant, +items.variant.inventory_quantity, +items.variant.manage_inventory, +items.variant.allow_backorder, *items.variant.options, *promotions, *shipping_methods, *payment_collection, *shipping_address, *billing_address, *region, +item_subtotal, +discount_total, +shipping_total, +total, +original_item_total"

/** Порог бесплатной доставки — синхронно с backend (FREE_SHIPPING_THRESHOLD) */
export const FREE_SHIPPING_FROM = 15000

export type CartItem = HttpTypes.StoreCartLineItem

export function itemOrigin(item: CartItem): DeliveryOrigin {
  return deliveryOrigin(item.product?.metadata as Record<string, unknown> | undefined)
}

/** Группы корзины по складу: сначала «Из России» (приедет раньше), потом «Из Китая» */
export function groupByOrigin(items: CartItem[]) {
  const groups: { origin: DeliveryOrigin; items: CartItem[] }[] = []
  for (const origin of ["russia", "china"] as DeliveryOrigin[]) {
    const list = items.filter((i) => itemOrigin(i) === origin)
    if (list.length) groups.push({ origin, items: list })
  }
  return groups
}

/** Остатки вариантов: корзина Medusa их не считает, берём из /store/products */
export type StockMap = Record<string, number | null>

/** Максимум штук для строки: остаток варианта (10, если остатки не ведутся или неизвестны) */
export function maxQuantity(item: CartItem, stock: StockMap): number {
  const v = item.variant
  if (!v || v.manage_inventory === false || v.allow_backorder) return 10
  const qty = stock[v.id]
  if (qty === null || qty === undefined) return 10
  return Math.max(1, Math.min(10, qty))
}

/** В корзине больше, чем осталось на складе (только когда остаток точно известен) */
export function exceedsStock(item: CartItem, stock: StockMap): boolean {
  const v = item.variant
  if (!v || v.manage_inventory === false || v.allow_backorder) return false
  const qty = stock[v.id]
  return qty !== null && qty !== undefined && qty < item.quantity
}

/** Сумма товаров до промокода — по ней считается бесплатная доставка (как в провайдере доставки) */
export function itemsSubtotal(cart: HttpTypes.StoreCart): number {
  return (cart.items ?? []).reduce((sum, i) => sum + (i.unit_price ?? 0) * (i.quantity ?? 0), 0)
}

export function itemsCount(cart: HttpTypes.StoreCart | null | undefined): number {
  return (cart?.items ?? []).reduce((n, i) => n + (i.quantity ?? 0), 0)
}
