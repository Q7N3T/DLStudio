import { formatDateWindow, pluralize } from "./format"

/**
 * Сроки по складу. Тип склада хранится в product.metadata.delivery_origin
 * и совпадает со складом, где лежит остаток (см. backend/src/lib/seed).
 * Сроки — с момента заказа до получения, включая доставку по России.
 */
export type DeliveryOrigin = "russia" | "china"

export const DELIVERY: Record<DeliveryOrigin, { label: string; minDays: number; maxDays: number; hint: string }> = {
  russia: {
    label: "Из России",
    minDays: 3,
    maxDays: 5,
    hint: "Отправим со склада в Москве. Остались единичные размеры.",
  },
  china: {
    label: "Из Китая",
    minDays: 14,
    maxDays: 25,
    hint: "Везём напрямую от студии. Срок включает доставку до Москвы и по России.",
  },
}

export function deliveryOrigin(metadata: Record<string, unknown> | null | undefined): DeliveryOrigin {
  return metadata?.delivery_origin === "russia" ? "russia" : "china"
}

/** «Из России · 3–5 дней» */
export function deliveryBadge(origin: DeliveryOrigin): string {
  const d = DELIVERY[origin]
  return `${d.label} · ${d.minDays}–${d.maxDays} ${pluralize(d.maxDays, ["день", "дня", "дней"])}`
}

/** «~12–20 декабря» */
export function deliveryWindow(origin: DeliveryOrigin, from: Date = new Date()): string {
  const d = DELIVERY[origin]
  return formatDateWindow(d.minDays, d.maxDays, from)
}
