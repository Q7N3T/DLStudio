import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductSummary } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
import { PriceTag } from "./price-tag";
import { DeliveryBadge, ProductBadge, discountPercent } from "./product-badge";
import { SizeLine } from "./size-chips";

/** sizes для сетки 2 / 3 / 4 колонки */
export const PRODUCT_GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

const isSvg = (src: string) => src.endsWith(".svg");

interface ProductCardProps {
  product: ProductSummary;
  /** true для первых карточек над сгибом (LCP) */
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const [first, second] = product.images;
  const href = `/product/${product.slug}/`;
  const discount = product.onSale
    ? discountPercent(product.price.current, product.price.regular)
    : 0;
  const soldOut = !product.inStock;
  const name = product.studio ? `${product.studio.name} ${product.title}` : product.title;

  return (
    <article className={cn("group/card relative flex flex-col", className)}>
      <Link href={href} className="flex flex-col rounded-md focus-visible:outline-offset-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface-muted">
          {first ? (
            <Image
              src={first.src}
              alt={first.alt || name}
              fill
              sizes={PRODUCT_GRID_SIZES}
              priority={priority}
              unoptimized={isSvg(first.src)}
              className={cn(
                "object-cover transition-opacity duration-250",
                second && "[@media(hover:hover)]:group-hover/card:opacity-0",
                soldOut && "opacity-60",
              )}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs text-foreground-muted">
              Фото скоро
            </span>
          )}
          {second && (
            <Image
              src={second.src}
              alt=""
              aria-hidden
              fill
              sizes={PRODUCT_GRID_SIZES}
              unoptimized={isSvg(second.src)}
              className="hidden object-cover opacity-0 transition-opacity duration-250 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover/card:opacity-100"
            />
          )}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {soldOut ? (
              <ProductBadge tone="soldout">Продано</ProductBadge>
            ) : (
              <>
                {product.isNew && <ProductBadge tone="new">New</ProductBadge>}
                {discount > 0 && <ProductBadge tone="sale">−{discount}%</ProductBadge>}
              </>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-0.5 pr-1">
          {product.studio && (
            <p className="truncate text-xs font-bold tracking-wide uppercase">
              {product.studio.name}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm leading-5">{product.title}</h3>
          <p className="truncate text-xs text-foreground-muted">{product.productType}</p>
          <PriceTag price={product.price} size="sm" className="mt-1" />
          {!soldOut && <DeliveryBadge type={product.delivery} className="mt-1 self-start" />}
          {!soldOut && <SizeLine sizes={product.sizes} className="mt-1" />}
        </div>
      </Link>
      <FavoriteButton
        productId={product.id}
        productTitle={name}
        className="absolute top-0 right-0"
      />
    </article>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden>
      <Skeleton className="aspect-[3/4] w-full rounded-md" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-11/12" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-5 w-2/3" />
    </div>
  );
}

/** Сетка 2 / 3 / 4 колонки. */
export function ProductGrid({ children, className }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 lg:gap-x-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ProductGrid role="status" aria-label="Загружаем товары">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </ProductGrid>
  );
}
