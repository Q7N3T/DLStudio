import { PRODUCTS_PER_PAGE } from "@/config/catalog";
import type { DeliveryType } from "@/config/delivery";
import type { CatalogQuery, Gender, SortKey } from "./types";

/**
 * Состояние фильтров хранится в URL. Формат (короткий и читаемый):
 *   ?size=M,L&color=black&studio=dazo-studio&delivery=russia&price=5000-15000&stock=all&sort=new&page=2&q=куртка
 * Категория/тег приходят из пути (/product-category/…, /product-tag/…), пол — из настроек.
 * Значения по умолчанию в URL не пишутся.
 */

export const DEFAULT_PER_PAGE = PRODUCTS_PER_PAGE;

const SORTS: SortKey[] = ["popular", "new", "price-asc", "price-desc"];
const DELIVERY_TYPES: DeliveryType[] = ["russia", "china"];

export function defaultQuery(overrides: Partial<CatalogQuery> = {}): CatalogQuery {
  return {
    sizes: [],
    colors: [],
    studios: [],
    delivery: [],
    inStockOnly: true,
    sort: "popular",
    page: 1,
    perPage: PRODUCTS_PER_PAGE,
    ...overrides,
  };
}

type ParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | { get(name: string): string | null };

function read(params: ParamsLike, key: string): string | undefined {
  if (typeof (params as URLSearchParams).get === "function") {
    return (params as URLSearchParams).get(key) ?? undefined;
  }
  const v = (params as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(v) ? v[0] : v;
}

function list(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, 50);
}

function positiveInt(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** URL → запрос. Мусор в параметрах молча игнорируется. */
export function parseCatalogParams(
  params: ParamsLike,
  base: Partial<CatalogQuery> = {},
): CatalogQuery {
  const q = defaultQuery(base);

  q.sizes = list(read(params, "size"));
  q.colors = list(read(params, "color"));
  q.studios = list(read(params, "studio"));
  q.delivery = list(read(params, "delivery")).filter((d): d is DeliveryType =>
    DELIVERY_TYPES.includes(d as DeliveryType),
  );

  const price = read(params, "price");
  if (price) {
    const [a, b] = price.split("-");
    const min = positiveInt(a);
    const max = positiveInt(b);
    if (min !== undefined && max !== undefined && min > max) {
      q.priceMin = max;
      q.priceMax = min;
    } else {
      q.priceMin = min;
      q.priceMax = max;
    }
  }

  if (read(params, "stock") === "all") q.inStockOnly = false;

  const sort = read(params, "sort");
  if (sort && SORTS.includes(sort as SortKey)) q.sort = sort as SortKey;

  const page = positiveInt(read(params, "page"));
  if (page && page >= 1) q.page = page;

  const search = read(params, "q")?.trim();
  if (search) q.q = search.slice(0, 100);

  const gender = read(params, "gender");
  if (gender === "man" || gender === "woman") q.gender = gender as Gender;

  return q;
}

/** Запрос → строка параметров без значений по умолчанию (для ссылок и router.replace). */
export function serializeCatalogQuery(query: Partial<CatalogQuery>): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.sizes?.length) p.set("size", query.sizes.join(","));
  if (query.colors?.length) p.set("color", query.colors.join(","));
  if (query.studios?.length) p.set("studio", query.studios.join(","));
  if (query.delivery?.length) p.set("delivery", query.delivery.join(","));
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    p.set("price", `${query.priceMin ?? ""}-${query.priceMax ?? ""}`);
  }
  if (query.inStockOnly === false) p.set("stock", "all");
  if (query.sort && query.sort !== "popular") p.set("sort", query.sort);
  if (query.page && query.page > 1) p.set("page", String(query.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
