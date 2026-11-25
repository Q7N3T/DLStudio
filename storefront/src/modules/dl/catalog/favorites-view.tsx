"use client"

import { listProducts } from "@lib/data/products"
import { useFavorites } from "@lib/dl/favorites"
import { pluralize } from "@lib/dl/format"
import { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ProductGrid, ProductTile, ProductTileSkeleton } from "../product/product-tile"

/** Избранное без регистрации: ID из localStorage → товары из Store API в том же порядке */
export function FavoritesView({ countryCode }: { countryCode: string }) {
  const { ids } = useFavorites()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[] | null>(null)
  const key = ids.join(",")

  useEffect(() => {
    let cancelled = false
    if (!ids.length) {
      Promise.resolve().then(() => !cancelled && setProducts([]))
      return () => {
        cancelled = true
      }
    }
    listProducts({ countryCode, queryParams: { id: ids, limit: ids.length } as HttpTypes.StoreProductListParams })
      .then(({ response }) => {
        if (cancelled) return
        const byId = new Map(response.products.map((p) => [p.id, p]))
        setProducts(ids.map((id) => byId.get(id)).filter((p): p is HttpTypes.StoreProduct => !!p))
      })
      .catch(() => !cancelled && setProducts([]))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, countryCode])

  return (
    <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_1.5rem)] pt-4 lg:!px-6 lg:pt-6">
      <h1 className="text-2xl font-bold lg:text-3xl">Избранное</h1>
      {products && products.length > 0 && (
        <p className="mt-1 text-sm text-dl-fg-muted">
          {products.length} {pluralize(products.length, ["товар", "товара", "товаров"])} · хранится на этом устройстве
        </p>
      )}
      {products === null ? (
        <ProductGrid className="mt-6">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductTileSkeleton key={i} />
          ))}
        </ProductGrid>
      ) : products.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-dl-muted" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
                stroke="currentColor"
                strokeWidth="1.7"
                fill="none"
              />
            </svg>
          </span>
          <h2 className="text-lg font-bold">Пока пусто</h2>
          <p className="mt-2 text-sm text-dl-fg-muted">Нажмите на сердечко у товара — он появится здесь. Регистрация не нужна.</p>
          <Link href={`/${countryCode}/store`} className="mt-6 inline-flex h-11 items-center rounded-md bg-dl-fg px-5 text-sm font-semibold text-white">
            В каталог
          </Link>
        </div>
      ) : (
        <ProductGrid className="mt-6">
          {products.map((p) => (
            <ProductTile key={p.id} product={p} countryCode={countryCode} />
          ))}
        </ProductGrid>
      )}
    </div>
  )
}
