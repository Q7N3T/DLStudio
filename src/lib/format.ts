import { DELIVERY, type DeliveryType } from "@/config/delivery";

const NBSP = " ";

/** 14590 → «14 590 ₽» (неразрывные пробелы, чтобы цена не переносилась). */
export function formatPrice(rubles: number): string {
  const rounded = Math.round(rubles);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${sign}${digits}${NBSP}₽`;
}

/** Диапазон для вариативных товаров: «от 9 990 ₽» или «9 990 – 12 490 ₽». */
export function formatPriceRange(
  min: number,
  max: number,
  style: "from" | "range" = "from",
): string {
  if (min === max) return formatPrice(min);
  if (style === "from") return `от${NBSP}${formatPrice(min)}`;
  return `${formatPrice(min).replace(`${NBSP}₽`, "")}${NBSP}–${NBSP}${formatPrice(max)}`;
}

/** Бейдж в каталоге: «Из России · 3–5 дней». */
export function formatDeliveryBadge(type: DeliveryType): string {
  const d = DELIVERY[type];
  return `${d.label} · ${d.minDays}–${d.maxDays}${NBSP}${pluralize(d.maxDays, ["день", "дня", "дней"])}`;
}

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Примерная дата доставки для карточки товара:
 * «~12–20 декабря» или «~28 декабря – 3 января».
 */
export function formatDeliveryWindow(type: DeliveryType, from: Date = new Date()): string {
  const d = DELIVERY[type];
  const start = addDays(from, d.minDays);
  const end = addDays(from, d.maxDays);
  const sm = MONTHS_GENITIVE[start.getMonth()];
  const em = MONTHS_GENITIVE[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `~${start.getDate()}–${end.getDate()}${NBSP}${em}`;
  }
  return `~${start.getDate()}${NBSP}${sm} – ${end.getDate()}${NBSP}${em}`;
}

/** Русская плюрализация: pluralize(5, ["товар", "товара", "товаров"]) → «товаров». */
export function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
