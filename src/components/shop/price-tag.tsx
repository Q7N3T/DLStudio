import type { Price } from "@/lib/catalog/types";
import { formatPrice, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: Price;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Цена: текущая + зачёркнутая старая при скидке; «от …» для вариаций с разной ценой.
 * Старая цена озвучивается скринридером явно.
 */
export function PriceTag({ price, size = "md", className }: PriceTagProps) {
  const hasRange = price.min !== undefined && price.max !== undefined && price.min !== price.max;
  const onSale = price.regular > price.current;
  const current = hasRange
    ? formatPriceRange(price.min!, price.max!, "from")
    : formatPrice(price.current);

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-bold tabular-nums",
          onSale && "text-brand-strong",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {onSale && <span className="sr-only">Цена со скидкой: </span>}
        {current}
      </span>
      {onSale && !hasRange && (
        <s
          className={cn(
            "text-foreground-muted tabular-nums",
            size === "lg" ? "text-base" : "text-xs",
          )}
        >
          <span className="sr-only">Без скидки: </span>
          {formatPrice(price.regular)}
        </s>
      )}
    </p>
  );
}
