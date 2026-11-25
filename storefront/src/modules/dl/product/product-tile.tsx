import { clx } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import {
  availableSizes,
  parseProductName,
  productInStock,
  productOrigin,
  productPrice,
  type StoreProductWithStudio,
} from "@lib/dl/product"
import { Badge, DeliveryBadge } from "../ui/badge"
import { FavoriteButton } from "../ui/favorite-button"
import { Price } from "../ui/price"

/** sizes для сеток 2 / 3 / 4 колонки и горизонтальных лент */
export const TILE_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"

interface ProductTileProps {
  product: HttpTypes.StoreProduct
  countryCode: string
  /** Первые карточки над сгибом — для LCP */
  priority?: boolean
  className?: string
}

/**
 * Плитка товара: фото 3:4 (второе фото при наведении на десктопе), сердечко,
 * студия, название (≤2 строки), тип, цена со скидкой, срок доставки, размеры в наличии.
 */
export function ProductTile({ product, countryCode, priority, className }: ProductTileProps) {
  const p = product as StoreProductWithStudio
  const name = parseProductName(p)
  const price = productPrice(product)
  const inStock = productInStock(product)
  const origin = productOrigin(product)
  const sizes = availableSizes(product)
  const images = product.images ?? []
  const [first, second] = images
  const label = [name.studio, name.title].filter(Boolean).join(" ")
  const href = `/${countryCode}/products/${product.handle}`

  return (
    <article className={clx("group/tile relative flex flex-col", className)}>
      <Link href={href} className="flex flex-col rounded-md focus-visible:outline-offset-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-dl-muted">
          {first?.url || product.thumbnail ? (
            <Image
              src={first?.url ?? product.thumbnail!}
              alt={label}
              fill
              sizes={TILE_SIZES}
              priority={priority}
              className={clx(
                "object-cover transition-opacity duration-200",
                second && "[@media(hover:hover)]:group-hover/tile:opacity-0",
                !inStock && "opacity-50"
              )}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs text-dl-fg-muted">Фото скоро</span>
          )}
          {second?.url && (
            <Image
              src={second.url}
              alt=""
              aria-hidden
              fill
              sizes={TILE_SIZES}
              className="hidden object-cover opacity-0 transition-opacity duration-200 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover/tile:opacity-100"
            />
          )}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {!inStock ? (
              <Badge tone="soldout">Продано</Badge>
            ) : (
              price?.onSale && price.discount > 0 && <Badge tone="sale">−{price.discount}%</Badge>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-0.5 pr-1">
          {name.studio && <p className="truncate text-xs font-bold uppercase tracking-wide">{name.studio}</p>}
          <h3 className="line-clamp-2 text-sm leading-5">{name.title}</h3>
          {name.type && <p className="truncate text-xs text-dl-fg-muted">{name.type}</p>}
          <Price price={price} size="sm" className="mt-1" />
          {inStock && <DeliveryBadge origin={origin} className="mt-1 self-start" />}
          {inStock && sizes.length > 0 && (
            <p className="mt-1 truncate text-xs tabular-nums text-dl-fg-muted">
              <span className="sr-only">В наличии размеры: </span>
              {sizes.join(" · ")}
            </p>
          )}
        </div>
      </Link>
      <FavoriteButton productId={product.id} label={label} className="absolute right-0 top-0" />
    </article>
  )
}

export function ProductTileSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden>
      <div className="aspect-[3/4] w-full animate-pulse rounded-md bg-dl-muted" />
      <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-dl-muted" />
      <div className="mt-2 h-4 w-11/12 animate-pulse rounded bg-dl-muted" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-dl-muted" />
    </div>
  )
}

/** Сетка 2 / 3 / 4 колонки */
export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clx("grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 lg:gap-x-5", className)}>
      {children}
    </div>
  )
}

/** Горизонтальная лента со снапом (мобильный паттерн маркетплейсов) */
export function ProductRail({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="py-6">
      <div className="mb-3 flex items-end justify-between gap-4 px-4 lg:px-0">
        <h2 className="text-lg font-bold lg:text-xl">{title}</h2>
        {action}
      </div>
      <div className="no-scrollbar -mb-2 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
        {children}
      </div>
    </section>
  )
}
