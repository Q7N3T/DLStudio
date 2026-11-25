/** Форматирование для витрины DL Studio: рубли, даты доставки, склонения. */

const NBSP = " "

/** 14590 → «14 590 ₽» (неразрывные пробелы — цена не переносится) */
export function formatPrice(rubles: number | null | undefined): string {
  if (rubles === null || rubles === undefined || !Number.isFinite(rubles)) return ""
  const rounded = Math.round(rubles)
  const sign = rounded < 0 ? "-" : ""
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return `${sign}${digits}${NBSP}₽`
}

/** «от 9 990 ₽» для товаров, у которых варианты стоят по-разному */
export function formatFromPrice(rubles: number): string {
  return `от${NBSP}${formatPrice(rubles)}`
}

/** Русская плюрализация: pluralize(5, ["товар", "товара", "товаров"]) → «товаров» */
export function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]

const addDays = (date: Date, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** «~12–20 декабря» или «~28 декабря – 3 января» */
export function formatDateWindow(minDays: number, maxDays: number, from: Date = new Date()): string {
  const a = addDays(from, minDays)
  const b = addDays(from, maxDays)
  if (a.getMonth() === b.getMonth()) return `~${a.getDate()}–${b.getDate()}${NBSP}${MONTHS[b.getMonth()]}`
  return `~${a.getDate()}${NBSP}${MONTHS[a.getMonth()]} – ${b.getDate()}${NBSP}${MONTHS[b.getMonth()]}`
}

/** Процент скидки: 7990 от 9990 → 20 */
export function discountPercent(current: number, regular: number): number {
  if (!regular || current >= regular) return 0
  return Math.round((1 - current / regular) * 100)
}
