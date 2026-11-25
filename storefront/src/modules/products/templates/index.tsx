import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getStudio } from "@lib/data/studios"
import {
  isShoes,
  parseProductName,
  productDetails,
  productInStock,
  productOrigin,
  productPrice,
  type StoreProductWithStudio,
} from "@lib/dl/product"
import { Badge } from "@modules/dl/ui/badge"
import { BuyBox } from "@modules/dl/product/buy-box"
import { DeliveryBlock, TrustBlock } from "@modules/dl/product/delivery-trust"
import { ProductDetailsAccordion } from "@modules/dl/product/details"
import { Gallery } from "@modules/dl/product/gallery"
import { ProductRail, ProductTile, ProductTileSkeleton } from "@modules/dl/product/product-tile"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

/**
 * Карточка товара DL Studio (mobile-first).
 * Телефон: галерея на всю ширину → студия/название/тип → покупка → доставка → гарантии → описание/состав/замеры → ленты.
 * Десктоп: галерея слева, закреплённая колонка покупки справа.
 */
export default function ProductTemplate({ product, countryCode }: ProductTemplateProps) {
  if (!product?.id) return notFound()

  const p = product as StoreProductWithStudio
  const name = parseProductName(p)
  const origin = productOrigin(product)
  const details = productDetails(product)
  const price = productPrice(product)
  const inStock = productInStock(product)
  const category = [...(product.categories ?? [])].sort((a, b) => (b.handle?.length ?? 0) - (a.handle?.length ?? 0))[0]
  const fullName = [name.studio, name.title].filter(Boolean).join(" ")

  return (
    <div className="bg-dl-bg pb-[calc(var(--dl-tabbar-h)_+_5rem)] lg:pb-16">
      <nav aria-label="Хлебные крошки" className="content-container hidden py-4 text-sm text-dl-fg-muted lg:block">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={`/${countryCode}/store`} className="hover:text-dl-fg">
              Каталог
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/${countryCode}/categories/${category.handle}`} className="hover:text-dl-fg">
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-dl-fg">
            {name.title}
          </li>
        </ol>
      </nav>

      <div className="lg:content-container lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Gallery
            images={(product.images ?? []).map((i) => ({ url: i.url }))}
            alt={fullName || product.title}
            productId={product.id}
            overlay={
              !inStock ? (
                <Badge tone="soldout">Продано</Badge>
              ) : price?.onSale && price.discount > 0 ? (
                <Badge tone="sale">−{price.discount}%</Badge>
              ) : null
            }
          />
        </div>

        <div className="px-4 pt-4 lg:col-span-5 lg:px-0 lg:pt-0">
          <div className="flex flex-col gap-5 lg:sticky lg:top-24">
            <header>
              {name.studio && p.studio?.handle && (
                <Link
                  href={`/${countryCode}/studios/${p.studio.handle}`}
                  className="inline-flex min-h-[32px] items-center text-sm font-bold uppercase tracking-wide underline-offset-4 hover:underline"
                >
                  {name.studio}
                </Link>
              )}
              <h1 className="text-xl font-semibold leading-7 lg:text-2xl lg:leading-8">{name.title}</h1>
              {name.type && <p className="mt-0.5 text-sm text-dl-fg-muted">{name.type}</p>}
            </header>

            <BuyBox product={product} countryCode={countryCode} />
            <DeliveryBlock origin={origin} />
            <TrustBlock countryCode={countryCode} />
            <ProductDetailsAccordion description={product.description ?? null} details={details} shoes={isShoes(product)} />
          </div>
        </div>
      </div>

      <div className="lg:content-container mt-6">
        <Suspense fallback={<RailSkeleton title="Похожие" />}>
          <SimilarProducts product={product} countryCode={countryCode} />
        </Suspense>
        {p.studio?.handle && (
          <Suspense fallback={<RailSkeleton title={`Ещё от ${p.studio.name}`} />}>
            <StudioProducts studioHandle={p.studio.handle} studioName={p.studio.name} productId={product.id} countryCode={countryCode} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

const railItem = "w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-auto"

async function SimilarProducts({ product, countryCode }: { product: HttpTypes.StoreProduct; countryCode: string }) {
  const leaf = [...(product.categories ?? [])].sort((a, b) => (b.handle?.length ?? 0) - (a.handle?.length ?? 0))[0]
  if (!leaf) return null
  const { response } = await listProducts({
    countryCode,
    queryParams: { category_id: [leaf.id], limit: 12 } as HttpTypes.StoreProductListParams,
  })
  const items = response.products.filter((x) => x.id !== product.id && productInStock(x)).slice(0, 8)
  if (!items.length) return null
  return (
    <ProductRail
      title="Похожие"
      action={
        <Link href={`/${countryCode}/categories/${leaf.handle}`} className="text-sm font-semibold underline underline-offset-4">
          Все
        </Link>
      }
    >
      {items.map((x) => (
        <ProductTile key={x.id} product={x} countryCode={countryCode} className={railItem} />
      ))}
    </ProductRail>
  )
}

async function StudioProducts({
  studioHandle,
  studioName,
  productId,
  countryCode,
}: {
  studioHandle: string
  studioName: string
  productId: string
  countryCode: string
}) {
  const studio = await getStudio(studioHandle)
  const ids = (studio?.product_ids ?? []).filter((id) => id !== productId).slice(0, 12)
  if (!ids.length) return null
  const { response } = await listProducts({
    countryCode,
    queryParams: { id: ids, limit: ids.length } as HttpTypes.StoreProductListParams,
  })
  const items = response.products.filter(productInStock).slice(0, 8)
  if (!items.length) return null
  return (
    <ProductRail
      title={`Ещё от ${studioName}`}
      action={
        <Link href={`/${countryCode}/studios/${studioHandle}`} className="text-sm font-semibold underline underline-offset-4">
          Все
        </Link>
      }
    >
      {items.map((x) => (
        <ProductTile key={x.id} product={x} countryCode={countryCode} className={railItem} />
      ))}
    </ProductRail>
  )
}

function RailSkeleton({ title }: { title: string }) {
  return (
    <ProductRail title={title}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={railItem}>
          <ProductTileSkeleton />
        </div>
      ))}
    </ProductRail>
  )
}
