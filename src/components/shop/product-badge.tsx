import { cva, type VariantProps } from "class-variance-authority";
import { formatDeliveryBadge } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeliveryType } from "@/config/delivery";

const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-sm px-1.5 text-2xs leading-none font-bold tracking-wide whitespace-nowrap uppercase",
  {
    variants: {
      tone: {
        new: "bg-badge-new text-white",
        sale: "bg-badge-sale text-white",
        soldout: "bg-badge-soldout text-white",
        russia: "bg-success-soft font-semibold tracking-normal text-success normal-case",
        china: "bg-surface-muted font-semibold tracking-normal text-foreground-muted normal-case",
        neutral: "bg-surface text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface ProductBadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

/** Бейджи: NEW — чёрный, «Из России» — зелёный, «Скидка» — акцент, «Продано» — серый. */
export function ProductBadge({ tone, className, ...props }: ProductBadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** «Из России · 3–5 дней» / «Из Китая · 14–25 дней» — сроки из config/delivery. */
export function DeliveryBadge({ type, className }: { type: DeliveryType; className?: string }) {
  return (
    <ProductBadge tone={type} className={className}>
      {formatDeliveryBadge(type)}
    </ProductBadge>
  );
}

/** Процент скидки: «−20%». */
export function discountPercent(current: number, regular: number): number {
  if (regular <= 0 || current >= regular) return 0;
  return Math.round((1 - current / regular) * 100);
}
