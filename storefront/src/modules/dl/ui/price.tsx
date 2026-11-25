import { clx } from "@medusajs/ui"
import { formatFromPrice, formatPrice } from "@lib/dl/format"
import type { PriceInfo } from "@lib/dl/product"

const SIZES = {
  sm: { current: "text-sm", old: "text-xs" },
  md: { current: "text-base", old: "text-xs" },
  lg: { current: "text-2xl leading-8", old: "text-base" },
} as const

/** Цена: текущая (акцентом при скидке) + зачёркнутая старая; «от …» для разных цен вариантов */
export function Price({ price, size = "md", className }: { price: PriceInfo | null; size?: keyof typeof SIZES; className?: string }) {
  if (!price) return null
  const s = SIZES[size]
  return (
    <p className={clx("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={clx("font-bold tabular-nums", s.current, price.onSale && "text-dl-brand-strong")}>
        {price.onSale && <span className="sr-only">Цена со скидкой: </span>}
        {price.isRange ? formatFromPrice(price.current) : formatPrice(price.current)}
      </span>
      {price.onSale && !price.isRange && (
        <s className={clx("tabular-nums text-dl-fg-muted", s.old)}>
          <span className="sr-only">Без скидки: </span>
          {formatPrice(price.regular)}
        </s>
      )}
    </p>
  )
}
