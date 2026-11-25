import { HttpTypes } from "@medusajs/types"
import { deliveryOrigin, type DeliveryOrigin } from "./delivery"
import { discountPercent } from "./format"

/**
 * Хелперы карточки товара: разбор названия, цены, размеры, «нижняя часть» карточки.
 * Работают с ответом /store/products, запрошенным с полями PRODUCT_FIELDS.
 */

/** Поля, которые витрина запрашивает у /store/products */
export const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*variants.images,+metadata,+tags,*studio,*categories,*options,*options.values"

export const COLOR_OPTION = "Цвет"
export const SIZE_OPTION = "Размер"

export type StoreProductWithStudio = HttpTypes.StoreProduct & {
  studio?: { id: string; name: string; handle: string; description?: string | null } | null
}

export interface ProductName {
  /** «Ботинки» */
  type: string | null
  /** «HANQIAORIJI» */
  studio: string | null
  /** «Deconstructed High Top Training Boots» */
  title: string
}

/** «Ботинки «HANQIAORIJI Deconstructed Boots»» → тип, студия, короткое название */
export function parseProductName(product: StoreProductWithStudio): ProductName {
  const full = product.title ?? ""
  const m = full.match(/^(.*?)\s*[«“"](.+?)[»”"]?\s*$/)
  const studio = product.studio?.name ?? null
  let title = (m?.[2] ?? full).trim()
  // «Hualun Studio» в названии товара часто пишут без «Studio»: «Hualun Double Belt…»
  for (const prefix of studio ? [studio, studio.replace(/\s+studio$/i, "")] : []) {
    if (title.toLowerCase().startsWith(prefix.toLowerCase() + " ")) {
      title = title.slice(prefix.length).trim()
      break
    }
  }
  return { type: product.subtitle || m?.[1]?.trim() || null, studio, title }
}

type PricedVariant = HttpTypes.StoreProductVariant & {
  calculated_price?: {
    calculated_amount?: number | null
    original_amount?: number | null
    calculated_price?: { price_list_type?: string | null } | null
  } | null
}

export interface PriceInfo {
  current: number
  regular: number
  /** Варианты стоят по-разному → «от …» */
  isRange: boolean
  onSale: boolean
  discount: number
}

export function variantPrice(variant: HttpTypes.StoreProductVariant | undefined | null): PriceInfo | null {
  const cp = (variant as PricedVariant | undefined)?.calculated_price
  if (!cp?.calculated_amount) return null
  const current = cp.calculated_amount
  const regular = cp.original_amount ?? current
  return {
    current,
    regular,
    isRange: false,
    onSale: regular > current,
    discount: discountPercent(current, regular),
  }
}

/** Цена для плитки: минимальная среди вариантов в наличии (или всех, если товар распродан) */
export function productPrice(product: HttpTypes.StoreProduct): PriceInfo | null {
  const variants = (product.variants ?? []) as PricedVariant[]
  const inStock = variants.filter(isInStock)
  const pool = (inStock.length ? inStock : variants).map(variantPrice).filter((x): x is PriceInfo => !!x)
  if (!pool.length) return null
  const cheapest = pool.reduce((a, b) => (b.current < a.current ? b : a))
  const isRange = pool.some((p) => p.current !== cheapest.current)
  return { ...cheapest, isRange }
}

export function isInStock(variant: HttpTypes.StoreProductVariant | undefined | null): boolean {
  if (!variant) return false
  return !variant.manage_inventory || !!variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
}

export function productInStock(product: HttpTypes.StoreProduct): boolean {
  return (product.variants ?? []).some(isInStock)
}

export function optionByTitle(product: HttpTypes.StoreProduct, title: string) {
  return product.options?.find((o) => o.title === title) ?? null
}

/** Значение опции варианта по её названию */
export function variantOptionValue(variant: HttpTypes.StoreProductVariant, optionTitle: string, product: HttpTypes.StoreProduct) {
  const option = optionByTitle(product, optionTitle)
  if (!option) return null
  return variant.options?.find((o) => o.option_id === option.id)?.value ?? null
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL"]
export function compareSizes(a: string, b: string): number {
  const na = Number(a.replace(",", "."))
  const nb = Number(b.replace(",", "."))
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  const ia = LETTER_SIZES.indexOf(a.toUpperCase())
  const ib = LETTER_SIZES.indexOf(b.toUpperCase())
  if (ia !== -1 && ib !== -1) return ia - ib
  if (Number.isFinite(na)) return 1
  if (Number.isFinite(nb)) return -1
  return a.localeCompare(b, "ru")
}

/** Все размеры товара (в порядке размерной шкалы) с наличием для выбранного цвета */
export function sizesForColor(product: HttpTypes.StoreProduct, color: string | null) {
  const sizeOption = optionByTitle(product, SIZE_OPTION)
  if (!sizeOption) return []
  const values = [...new Set((sizeOption.values ?? []).map((v) => v.value))].sort(compareSizes)
  return values.map((value) => {
    const variants = (product.variants ?? []).filter(
      (v) =>
        variantOptionValue(v, SIZE_OPTION, product) === value &&
        (!color || variantOptionValue(v, COLOR_OPTION, product) === color)
    )
    return { value, inStock: variants.some(isInStock), exists: variants.length > 0 }
  })
}

/** Доступные размеры одной строкой для плитки: «S · M · XL» */
export function availableSizes(product: HttpTypes.StoreProduct): string[] {
  return sizesForColor(product, null)
    .filter((s) => s.inStock && s.value !== "Единый")
    .map((s) => s.value)
}

export interface SizeChart {
  columns: string[]
  rows: string[][]
}

/** «Нижняя часть» карточки из product.metadata.details (см. README бэкенда) */
export interface ProductDetails {
  season: string | null
  model_params: string[]
  size_chart: SizeChart | null
  size_chart_note: string | null
  composition: string[]
  care: string | null
  temperature: string | null
  features: { label: string; value: string }[]
}

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [])
const asString = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)

export function productDetails(product: HttpTypes.StoreProduct): ProductDetails {
  const raw = (product.metadata?.details ?? {}) as Record<string, unknown>
  const chart = raw.size_chart as SizeChart | null | undefined
  return {
    season: asString(raw.season),
    model_params: asStrings(raw.model_params),
    size_chart: chart && Array.isArray(chart.columns) && Array.isArray(chart.rows) && chart.rows.length ? chart : null,
    size_chart_note: asString(raw.size_chart_note),
    composition: asStrings(raw.composition),
    care: asString(raw.care),
    temperature: asString(raw.temperature),
    features: Array.isArray(raw.features)
      ? (raw.features as { label: unknown; value: unknown }[])
          .filter((f) => typeof f?.label === "string" && typeof f?.value === "string")
          .map((f) => ({ label: f.label as string, value: f.value as string }))
      : [],
  }
}

export function productOrigin(product: HttpTypes.StoreProduct): DeliveryOrigin {
  return deliveryOrigin(product.metadata)
}

/** Обувь: таблица — длина стопы по размерам */
export function isShoes(product: HttpTypes.StoreProduct): boolean {
  const handles = (product.categories ?? []).map((c) => c.handle)
  return handles.some((h) => /shoes|boots|sneakers|low-shoes|slippers/.test(h ?? ""))
}

/** Порядковый номер «новизны»: на сайте ID растут со временем */
export function isNew(product: HttpTypes.StoreProduct, newestRefs: Set<number>): boolean {
  const ref = Number(product.metadata?.legacy_ref)
  return Number.isFinite(ref) && newestRefs.has(ref)
}
