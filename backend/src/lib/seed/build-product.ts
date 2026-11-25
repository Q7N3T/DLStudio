import type { ProductDetails, SnapshotProduct } from "./snapshot"

/**
 * Чистые функции подготовки товаров снимка для сида (без обращения к Medusa) — покрыты тестами.
 */

export const COLOR_OPTION = "Цвет"
export const SIZE_OPTION = "Размер"
/** Размер для товаров без размерной сетки (сумки, цепочки) */
export const ONE_SIZE = "Единый"
/** Остаток «под заказ» на складе в Китае для каждой доступной вариации */
export const CHINA_STOCK = 50
/** На складе в России остаются единичные размеры */
export const RUSSIA_STOCK = 1

export type DeliveryOrigin = "china" | "russia"

export interface SeedVariant {
  title: string
  sku: string
  options: Record<string, string>
  price: number
  salePrice?: number
  stock: { china: number; russia: number }
}

export interface PreparedProduct {
  handle: string
  title: string
  subtitle: string | null
  description: string
  origin: DeliveryOrigin
  options: { title: string; values: string[] }[]
  variants: SeedVariant[]
  /** Структурированная «нижняя часть» карточки для витрины (без текста описания) */
  details: Omit<ProductDetails, "paragraphs">
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
}

/**
 * Handle для Medusa из слага WordPress. Medusa принимает только URL-безопасные символы,
 * а на сайте встречаются слаги кириллицей в URL-кодировке («%d1%80%d0%b5…» = «ремень…»):
 * декодируем и транслитерируем. Исходный слаг остаётся в metadata.legacy_slug для 301-редиректа.
 */
export function toHandle(slug: string): string {
  let s = slug
  try {
    s = decodeURIComponent(slug)
  } catch {
    // некорректная кодировка — оставляем как есть
  }
  return s
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const skuPart = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/g, "")
    .slice(0, 12)

export function prepareProduct(p: SnapshotProduct): PreparedProduct {
  const origin: DeliveryOrigin = p.russia ? "russia" : "china"
  const colorName = new Map(p.colors.map((c) => [c.slug, c.name]))

  // Сочетания берём из существующих вариаций; у простых товаров — одно сочетание из атрибутов
  let combos = p.variations.map((v) => ({
    color: v.color ? colorName.get(v.color) ?? v.color : null,
    size: v.size,
  }))
  if (!combos.length) combos = [{ color: p.colors[0]?.name ?? null, size: p.sizes[0] ?? null }]
  // Вариации без размера и цвета (бывает у простых товаров) — «Единый»
  combos = combos.map((c) => (c.color || c.size ? c : { color: null, size: ONE_SIZE }))
  // Дубликаты сочетаний Medusa не примет
  const seen = new Set<string>()
  combos = combos.filter((c) => {
    const key = `${c.color}|${c.size}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const colors = [...new Set(combos.map((c) => c.color).filter((x): x is string => !!x))]
  const sizes = [...new Set(combos.map((c) => c.size).filter((x): x is string => !!x))]
  // Если у части вариаций нет цвета/размера, а у других есть, дополняем значением по умолчанию
  const options: PreparedProduct["options"] = []
  if (colors.length) options.push({ title: COLOR_OPTION, values: colors })
  if (sizes.length) options.push({ title: SIZE_OPTION, values: sizes })

  const baseSku = p.sku?.trim() || `DL-${p.ref}`
  const stockQty = p.in_stock ? (origin === "russia" ? RUSSIA_STOCK : CHINA_STOCK) : 0

  const variants: SeedVariant[] = combos.map((c) => {
    const opts: Record<string, string> = {}
    if (colors.length) opts[COLOR_OPTION] = c.color ?? colors[0]
    if (sizes.length) opts[SIZE_OPTION] = c.size ?? sizes[0]
    return {
      title: Object.values(opts).join(" / ") || ONE_SIZE,
      sku: [baseSku, ...Object.values(opts).map(skuPart)].join("-"),
      options: opts,
      price: p.price,
      salePrice: p.sale_price && p.sale_price < p.price ? p.sale_price : undefined,
      stock: {
        china: origin === "china" ? stockQty : 0,
        russia: origin === "russia" ? stockQty : 0,
      },
    }
  })

  const { paragraphs, ...details } = p.details
  return {
    // Слаг с сайта: адрес /product/<slug>/ сохраняется (кириллица — транслитом)
    handle: toHandle(p.slug),
    title: p.name,
    subtitle: p.type,
    description: paragraphs.join("\n\n"),
    origin,
    options,
    variants,
    details,
  }
}
