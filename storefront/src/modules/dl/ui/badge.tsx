import { clx } from "@medusajs/ui"
import { deliveryBadge, type DeliveryOrigin } from "@lib/dl/delivery"

type Tone = "new" | "sale" | "soldout" | "russia" | "china" | "neutral"

const TONES: Record<Tone, string> = {
  new: "bg-dl-fg text-white uppercase tracking-wide font-bold",
  sale: "bg-dl-brand-strong text-white font-bold",
  soldout: "bg-dl-soldout text-white uppercase tracking-wide font-bold",
  russia: "bg-dl-success-soft text-dl-success font-semibold",
  china: "bg-dl-muted text-dl-fg-muted font-semibold",
  neutral: "bg-dl-surface text-dl-fg font-semibold",
}

/** Бейджи: NEW — чёрный, «Из России» — зелёный, скидка — акцент, «Продано» — серый */
export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={clx("inline-flex h-5 items-center whitespace-nowrap rounded-[2px] px-1.5 text-[11px] leading-none", TONES[tone], className)}>
      {children}
    </span>
  )
}

export function DeliveryBadge({ origin, className }: { origin: DeliveryOrigin; className?: string }) {
  return (
    <Badge tone={origin} className={className}>
      {deliveryBadge(origin)}
    </Badge>
  )
}
