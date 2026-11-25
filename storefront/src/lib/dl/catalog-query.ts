import type { DeliveryOrigin } from "./delivery"

/**
 * Состояние каталога хранится в URL (короткий читаемый формат):
 *   ?size=M,L&color=Чёрный&studio=dazo-studio&delivery=russia&price=5000-15000&stock=all&sort=price-asc&q=куртка
 * Раздел, коллекция и студия приходят из пути страницы. Значения по умолчанию в URL не пишутся.
 */

export type SortKey = "popular" | "new" | "price-asc" | "price-desc"

export const SORTS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "new", label: "Новинки" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
]

export interface CatalogFilters {
  q?: string
  /** handle подкатегории, выбранной в фильтре (поверх раздела страницы) */
  category?: string
  sizes: string[]
  colors: string[]
  studios: string[]
  delivery: DeliveryOrigin[]
  priceMin?: number
  priceMax?: number
  /** По умолчанию true: распроданное скрыто */
  inStockOnly: boolean
  sort: SortKey
  page: number
}

export const PER_PAGE = 24

export function emptyFilters(): CatalogFilters {
  return { sizes: [], colors: [], studios: [], delivery: [], inStockOnly: true, sort: "popular", page: 1 }
}

type Params = Record<string, string | string[] | undefined>

const one = (p: Params, k: string) => {
  const v = p[k]
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined
}
const list = (p: Params, k: string) =>
  [...new Set((one(p, k) ?? "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 40)
const int = (v: string | undefined) => {
  if (!v) return undefined
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/** URL → фильтры. Мусор молча игнорируется. */
export function parseFilters(params: Params): CatalogFilters {
  const f = emptyFilters()
  f.q = one(params, "q")?.slice(0, 100)
  f.category = one(params, "category")
  f.sizes = list(params, "size")
  f.colors = list(params, "color")
  f.studios = list(params, "studio")
  f.delivery = list(params, "delivery").filter((d): d is DeliveryOrigin => d === "russia" || d === "china")
  const price = one(params, "price")
  if (price) {
    const [a, b] = price.split("-")
    let min = int(a)
    let max = int(b)
    if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]
    f.priceMin = min
    f.priceMax = max
  }
  if (one(params, "stock") === "all") f.inStockOnly = false
  const sort = one(params, "sort")
  if (SORTS.some((s) => s.value === sort)) f.sort = sort as SortKey
  const page = int(one(params, "page"))
  if (page && page > 1) f.page = page
  return f
}

/** Фильтры → строка запроса без значений по умолчанию (с «?» или пустая) */
export function serializeFilters(f: Partial<CatalogFilters>): string {
  const p = new URLSearchParams()
  if (f.q) p.set("q", f.q)
  if (f.category) p.set("category", f.category)
  if (f.sizes?.length) p.set("size", f.sizes.join(","))
  if (f.colors?.length) p.set("color", f.colors.join(","))
  if (f.studios?.length) p.set("studio", f.studios.join(","))
  if (f.delivery?.length) p.set("delivery", f.delivery.join(","))
  if (f.priceMin !== undefined || f.priceMax !== undefined) p.set("price", `${f.priceMin ?? ""}-${f.priceMax ?? ""}`)
  if (f.inStockOnly === false) p.set("stock", "all")
  if (f.sort && f.sort !== "popular") p.set("sort", f.sort)
  if (f.page && f.page > 1) p.set("page", String(f.page))
  const s = p.toString()
  return s ? `?${s}` : ""
}

/** Сколько фильтров активно (для бейджа на кнопке «Фильтры») */
export function activeCount(f: CatalogFilters): number {
  return (
    (f.category ? 1 : 0) +
    f.sizes.length +
    f.colors.length +
    f.studios.length +
    f.delivery.length +
    (f.priceMin !== undefined || f.priceMax !== undefined ? 1 : 0) +
    (f.inStockOnly ? 0 : 1)
  )
}
