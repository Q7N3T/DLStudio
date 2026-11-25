"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { PER_PAGE, type CatalogFilters } from "@lib/dl/catalog-query"
import { SIZE_OPTION, COLOR_OPTION, compareSizes } from "@lib/dl/product"
import { getCacheOptions } from "./cookies"
import { listProducts } from "./products"

/**
 * Каталог на поисковом индексе Medusa (backend/src/search/product.ts):
 * фильтры, сортировка, фасеты со счётчиками и статистика цен — одним запросом к /store/search,
 * затем товары с ценами и остатками — из /store/products?id=… в том же порядке.
 */

/** Область страницы: раздел, коллекция или студия из пути */
export interface CatalogScope {
  category?: string
  collection?: string
  studio?: string
}

export interface FacetValue {
  value: string
  count: number
}

export interface CatalogFacets {
  categories: FacetValue[]
  sizes: FacetValue[]
  colors: FacetValue[]
  studios: FacetValue[]
  delivery: FacetValue[]
  price: { min: number; max: number } | null
}

export interface CatalogResult {
  products: HttpTypes.StoreProduct[]
  total: number
  page: number
  pageCount: number
  facets: CatalogFacets
}

type SearchFilter = Record<string, unknown>

function buildFilters(scope: CatalogScope, f: CatalogFilters): SearchFilter {
  const and: SearchFilter[] = []
  if (scope.category) and.push({ category_handles: scope.category })
  if (f.category) and.push({ category_handles: f.category })
  if (scope.collection) and.push({ collection: scope.collection })
  if (scope.studio) and.push({ studio: scope.studio })
  if (f.inStockOnly) and.push({ in_stock: true })
  if (f.sizes.length) and.push({ option_values: { $in: f.sizes.map((s) => `${SIZE_OPTION}:${s}`) } })
  if (f.colors.length) and.push({ option_values: { $in: f.colors.map((c) => `${COLOR_OPTION}:${c}`) } })
  if (f.studios.length) and.push({ studio: { $in: f.studios } })
  if (f.delivery.length) and.push({ delivery_origin: { $in: f.delivery } })
  if (f.priceMin !== undefined) and.push({ min_price_rub: { $gte: f.priceMin } })
  if (f.priceMax !== undefined) and.push({ min_price_rub: { $lte: f.priceMax } })
  const filters: SearchFilter = and.length ? { $and: and } : {}
  if (f.q) filters.q = f.q
  return filters
}

function buildOrder(f: CatalogFilters): Record<string, "ASC" | "DESC"> | undefined {
  // Распроданное всегда в конце
  const base: Record<string, "ASC" | "DESC"> = { in_stock: "DESC" }
  switch (f.sort) {
    case "new":
      return { ...base, created_at: "DESC" }
    case "price-asc":
      return { ...base, min_price_rub: "ASC" }
    case "price-desc":
      return { ...base, min_price_rub: "DESC" }
    default:
      // Без поискового запроса «популярные» = сначала новые; с запросом — по релевантности
      return f.q ? undefined : { ...base, created_at: "DESC" }
  }
}

type RawFacet =
  | { type: "value"; values: { value: string; count: number }[] }
  | { type: "stats"; min: number; max: number; count: number }

interface SearchResponse {
  results: {
    hits: { id: string }[]
    facets?: Record<string, RawFacet>
    metadata?: { count?: number }
  }[]
}

const values = (f: RawFacet | undefined): FacetValue[] => (f && f.type === "value" ? f.values : [])

function splitOptions(raw: FacetValue[], option: string): FacetValue[] {
  const prefix = `${option}:`
  return raw
    .filter((v) => v.value.startsWith(prefix))
    .map((v) => ({ value: v.value.slice(prefix.length), count: v.count }))
}

/** Поиск по индексу: только ID, общее число и фасеты (дёшево — для счётчика «Показать N товаров») */
export async function searchCatalogIds(
  scope: CatalogScope,
  f: CatalogFilters,
  take = PER_PAGE,
  skip = (f.page - 1) * PER_PAGE
) {
  const next = { ...(await getCacheOptions("products")) }
  const order = buildOrder(f)
  const { results } = await sdk.client.fetch<SearchResponse>("/store/search", {
    method: "POST",
    body: {
      entity: "product",
      fields: ["id"],
      filters: buildFilters(scope, f),
      pagination: { skip, take, ...(order ? { order } : {}) },
      search_options: {
        count: "exact",
        disjunctive_facets: true,
        facets: [
          { field: "category_handles", limit: 100 },
          { field: "studio", limit: 100 },
          { field: "delivery_origin" },
          { field: "option_values", limit: 200 },
          { field: "min_price_rub", type: "stats" },
        ],
      },
    },
    next,
    cache: "no-store",
  })
  const r = results[0]
  const priceStats = r.facets?.min_price_rub
  const optionValues = values(r.facets?.option_values)
  return {
    ids: r.hits.map((h) => h.id),
    total: r.metadata?.count ?? r.hits.length,
    facets: {
      categories: values(r.facets?.category_handles),
      sizes: splitOptions(optionValues, SIZE_OPTION).sort((a, b) => compareSizes(a.value, b.value)),
      colors: splitOptions(optionValues, COLOR_OPTION).sort((a, b) => b.count - a.count),
      studios: values(r.facets?.studio),
      delivery: values(r.facets?.delivery_origin),
      price:
        priceStats && priceStats.type === "stats" && priceStats.count > 0
          ? { min: Math.floor(priceStats.min), max: Math.ceil(priceStats.max) }
          : null,
    } satisfies CatalogFacets,
  }
}

/** Только число товаров по фильтрам — для живого счётчика в шторке фильтров */
export async function countCatalog(scope: CatalogScope, f: CatalogFilters): Promise<number> {
  const { total } = await searchCatalogIds(scope, { ...f, page: 1 }, 0)
  return total
}

/**
 * cumulative: страницы 1…N разом (первый рендер с ?page=N — после «Показать ещё» и возврата назад
 * список восстанавливается целиком, а не только N-я страница). Не больше 96 товаров за запрос.
 */
export async function searchCatalog(
  scope: CatalogScope,
  f: CatalogFilters,
  countryCode: string,
  options: { cumulative?: boolean } = {}
): Promise<CatalogResult> {
  const cumulative = options.cumulative && f.page > 1
  const { ids, total, facets } = cumulative
    ? await searchCatalogIds(scope, f, Math.min(f.page * PER_PAGE, 96), 0)
    : await searchCatalogIds(scope, f)
  let products: HttpTypes.StoreProduct[] = []
  if (ids.length) {
    const { response } = await listProducts({
      countryCode,
      queryParams: { id: ids, limit: ids.length } as HttpTypes.StoreProductListParams,
    })
    const byId = new Map(response.products.map((p) => [p.id, p]))
    products = ids.map((id) => byId.get(id)).filter((p): p is HttpTypes.StoreProduct => !!p)
  }
  return {
    products,
    total,
    page: f.page,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
    facets,
  }
}
