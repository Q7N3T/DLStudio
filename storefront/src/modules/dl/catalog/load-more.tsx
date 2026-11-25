"use client"

import { searchCatalog, type CatalogScope } from "@lib/data/catalog"
import { serializeFilters, type CatalogFilters } from "@lib/dl/catalog-query"
import { pluralize } from "@lib/dl/format"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { ProductTile } from "../product/product-tile"

interface LoadMoreProps {
  scope: CatalogScope
  filters: CatalogFilters
  countryCode: string
  basePath: string
  page: number
  pageCount: number
  total: number
  shown: number
}

/**
 * «Показать ещё»: подгружает следующую страницу и добавляет к сетке (привычно на телефоне).
 * Без JS — обычная ссылка на следующую страницу.
 */
export function LoadMore({ scope, filters, countryCode, basePath, page, pageCount, total, shown }: LoadMoreProps) {
  const [extra, setExtra] = useState<HttpTypes.StoreProduct[]>([])
  const [current, setCurrent] = useState(page)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const left = total - shown - extra.length
  const nextHref = `${basePath}${serializeFilters({ ...filters, page: current + 1 })}`

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await searchCatalog(scope, { ...filters, page: current + 1 }, countryCode)
      setExtra((e) => [...e, ...res.products])
      setCurrent((p) => p + 1)
      window.history.replaceState(null, "", nextHref)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {extra.map((p) => (
        <ProductTile key={p.id} product={p} countryCode={countryCode} />
      ))}
      {current < pageCount && left > 0 && (
        <div className="col-span-full mt-2 flex flex-col items-center gap-2">
          <a
            href={nextHref}
            onClick={(e) => {
              e.preventDefault()
              if (!loading) load()
            }}
            aria-busy={loading}
            className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-md border-2 border-dl-fg text-sm font-semibold transition-colors hover:bg-dl-muted"
          >
            {loading ? "Загружаем…" : `Показать ещё ${Math.min(left, 24)} ${pluralize(Math.min(left, 24), ["товар", "товара", "товаров"])}`}
          </a>
          <p className="text-xs text-dl-fg-muted">
            Показано {shown + extra.length} из {total}
          </p>
          {error && (
            <p role="alert" className="text-sm text-dl-danger">
              Не получилось загрузить. Проверьте интернет и попробуйте ещё раз.
            </p>
          )}
        </div>
      )}
    </>
  )
}
