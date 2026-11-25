/**
 * Фиксированные тарифы доставки по России (заглушка до подключения API перевозчиков).
 * Суммы в рублях, цены включают НДС. Значения можно переопределить в medusa-config
 * через options провайдера — см. ShippingTariffsOptions.
 */

export type CarrierCode = "cdek" | "russian-post"

export interface CarrierTariff {
  code: CarrierCode
  /** Название для витрины и админки */
  name: string
  /** Описание варианта: «до пункта выдачи», «до отделения» */
  description: string
  price: number
  /** Срок доставки по России после отправки со склада, дней */
  days_min: number
  days_max: number
}

export interface ShippingTariffsOptions {
  /** Бесплатная доставка от этой суммы товаров (₽); 0 — порога нет */
  free_shipping_threshold?: number
  tariffs?: Partial<Record<CarrierCode, Partial<CarrierTariff>>>
}

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 15000

export const DEFAULT_TARIFFS: Record<CarrierCode, CarrierTariff> = {
  cdek: {
    code: "cdek",
    name: "СДЭК",
    description: "До пункта выдачи СДЭК",
    price: 490,
    days_min: 3,
    days_max: 7,
  },
  "russian-post": {
    code: "russian-post",
    name: "Почта России",
    description: "До отделения Почты России",
    price: 390,
    days_min: 7,
    days_max: 14,
  },
}

export function resolveTariffs(options: ShippingTariffsOptions = {}) {
  const tariffs = Object.fromEntries(
    (Object.keys(DEFAULT_TARIFFS) as CarrierCode[]).map((code) => [
      code,
      { ...DEFAULT_TARIFFS[code], ...(options.tariffs?.[code] ?? {}), code },
    ])
  ) as Record<CarrierCode, CarrierTariff>
  const threshold = options.free_shipping_threshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD
  return { tariffs, threshold: Math.max(0, threshold) }
}

export function isCarrierCode(value: unknown): value is CarrierCode {
  return typeof value === "string" && value in DEFAULT_TARIFFS
}

/** Минимальная форма строки корзины, нужная для расчёта. */
export interface PricedItem {
  unit_price?: unknown
  quantity?: unknown
}

/** Сумма товаров корзины в рублях (unit_price × quantity). Мусорные значения считаются нулём. */
export function itemsTotal(items: PricedItem[] | undefined | null): number {
  if (!items?.length) return 0
  return items.reduce((sum, item) => {
    const price = Number(item.unit_price)
    const qty = Number(item.quantity)
    if (!Number.isFinite(price) || !Number.isFinite(qty) || price < 0 || qty <= 0) return sum
    return sum + price * qty
  }, 0)
}

/** Цена доставки: тариф перевозчика или 0, если сумма товаров достигла порога. */
export function shippingPrice(
  carrier: CarrierCode,
  total: number,
  options: ShippingTariffsOptions = {}
): number {
  const { tariffs, threshold } = resolveTariffs(options)
  if (threshold > 0 && total >= threshold) return 0
  return tariffs[carrier].price
}
