import { DELIVERY, type DeliveryType } from "@/config/delivery";
import type {
  Category,
  CatalogFacets,
  CatalogQuery,
  FacetOption,
  Product,
  ProductList,
  ProductSummary,
} from "./types";

/**
 * Фильтрация, сортировка, фасеты и пагинация в памяти.
 * Используется MockProvider; WooProvider делегирует то же самое Store API,
 * а этот модуль служит эталоном поведения для тестов.
 */

export interface EngineContext {
  categories: Category[];
}

/** Слаги категории и всех её потомков. */
export function descendantSlugs(slug: string, categories: Category[]): Set<string> {
  const root = categories.find((c) => c.slug === slug);
  if (!root) return new Set([slug]);
  const out = new Set<string>([root.slug]);
  const queue = [root.id];
  while (queue.length) {
    const id = queue.shift()!;
    for (const c of categories) {
      if (c.parentId === id && !out.has(c.slug)) {
        out.add(c.slug);
        queue.push(c.id);
      }
    }
  }
  return out;
}

const norm = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е");

function matchesSearch(p: Product, q: string): boolean {
  const haystack = norm(
    [
      p.fullName,
      p.title,
      p.productType,
      p.studio?.name ?? "",
      p.sku,
      ...p.categories.map((c) => c.name),
      ...p.colors.map((c) => c.name),
    ].join(" "),
  );
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

type Dimension = "sizes" | "colors" | "studios" | "delivery" | "price" | "stock";

/** Применяет все фильтры, кроме `skip` (нужно для подсчёта фасетов). */
function passes(p: Product, q: CatalogQuery, scope: Set<string> | null, skip?: Dimension): boolean {
  if (scope && !p.categories.some((c) => scope.has(c.slug))) return false;
  if (q.tag && !p.tags.some((t) => t.slug === q.tag)) return false;
  if (q.gender && p.gender !== q.gender && p.gender !== "unisex") return false;
  if (q.q && !matchesSearch(p, q.q)) return false;

  if (skip !== "stock" && q.inStockOnly && !p.inStock) return false;
  if (skip !== "sizes" && q.sizes.length) {
    const ok = p.sizes.some((s) => q.sizes.includes(s.value) && (s.inStock || !q.inStockOnly));
    if (!ok) return false;
  }
  if (skip !== "colors" && q.colors.length && !p.colors.some((c) => q.colors.includes(c.slug))) {
    return false;
  }
  if (skip !== "studios" && q.studios.length && !(p.studio && q.studios.includes(p.studio.slug))) {
    return false;
  }
  if (skip !== "delivery" && q.delivery.length && !q.delivery.includes(p.delivery)) return false;
  if (skip !== "price") {
    const price = p.price.min ?? p.price.current;
    if (q.priceMin !== undefined && price < q.priceMin) return false;
    if (q.priceMax !== undefined && price > q.priceMax) return false;
  }
  return true;
}

/** Числовые размеры по возрастанию, буквенные — по шкале, остальное — по алфавиту. */
const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
export function compareSizes(a: string, b: string): number {
  const na = Number(a.replace(",", "."));
  const nb = Number(b.replace(",", "."));
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  if (Number.isFinite(na)) return 1;
  if (Number.isFinite(nb)) return -1;
  const ia = LETTER_SIZES.indexOf(a.toUpperCase());
  const ib = LETTER_SIZES.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, "ru");
}

function count<T extends string>(values: Iterable<T>): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function buildFacets(
  all: Product[],
  q: CatalogQuery,
  scope: Set<string> | null,
  ctx: EngineContext,
): CatalogFacets {
  const subset = (skip: Dimension) => all.filter((p) => passes(p, q, scope, skip));

  const sizeCounts = count(
    subset("sizes").flatMap((p) =>
      p.sizes.filter((s) => s.inStock || !q.inStockOnly).map((s) => s.value),
    ),
  );
  const colorMeta = new Map<string, { name: string; hex?: string }>();
  const colorCounts = count(
    subset("colors").flatMap((p) =>
      p.colors.map((c) => {
        colorMeta.set(c.slug, { name: c.name, hex: c.hex });
        return c.slug;
      }),
    ),
  );
  const studioMeta = new Map<string, string>();
  const studioCounts = count(
    subset("studios").flatMap((p) => {
      if (!p.studio) return [];
      studioMeta.set(p.studio.slug, p.studio.name);
      return [p.studio.slug];
    }),
  );
  const deliveryCounts = count(subset("delivery").map((p) => p.delivery));
  const priced = subset("price").map((p) => p.price.min ?? p.price.current);

  // Категории: прямые потомки текущей (или корни), со счётчиком по полному фильтру
  const filtered = all.filter((p) => passes(p, q, scope));
  const current = q.category ? ctx.categories.find((c) => c.slug === q.category) : undefined;
  const children = ctx.categories.filter((c) => c.parentId === (current?.id ?? null));
  const categories: FacetOption[] = children
    .map((c) => {
      const slugs = descendantSlugs(c.slug, ctx.categories);
      return {
        value: c.slug,
        label: c.name,
        count: filtered.filter((p) => p.categories.some((pc) => slugs.has(pc.slug))).length,
      };
    })
    .filter((o) => o.count > 0);

  const toOptions = (m: Map<string, number>, label: (v: string) => string): FacetOption[] =>
    [...m].map(([value, n]) => ({ value, label: label(value), count: n }));

  return {
    categories,
    sizes: toOptions(sizeCounts, (v) => v).sort((a, b) => compareSizes(a.value, b.value)),
    colors: toOptions(colorCounts, (v) => colorMeta.get(v)?.name ?? v)
      .map((o) => ({ ...o, hex: colorMeta.get(o.value)?.hex }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ru")),
    studios: toOptions(studioCounts, (v) => studioMeta.get(v) ?? v).sort((a, b) =>
      a.label.localeCompare(b.label, "en"),
    ),
    delivery: (["russia", "china"] as DeliveryType[])
      .filter((d) => deliveryCounts.has(d))
      .map((d) => ({ value: d, label: DELIVERY[d].label, count: deliveryCounts.get(d)! })),
    price: {
      min: priced.length ? Math.min(...priced) : 0,
      max: priced.length ? Math.max(...priced) : 0,
    },
  };
}

function sortProducts(items: Product[], q: CatalogQuery, popularity: (p: Product) => number) {
  const price = (p: Product) => p.price.min ?? p.price.current;
  return [...items].sort((a, b) => {
    // Распроданное всегда в конце
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    switch (q.sort) {
      case "new":
        return b.id - a.id;
      case "price-asc":
        return price(a) - price(b) || b.id - a.id;
      case "price-desc":
        return price(b) - price(a) || b.id - a.id;
      default:
        return popularity(b) - popularity(a) || b.id - a.id;
    }
  });
}

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    productType: p.productType,
    studio: p.studio,
    price: p.price,
    onSale: p.onSale,
    images: p.images.slice(0, 2),
    colors: p.colors,
    sizes: p.sizes,
    inStock: p.inStock,
    delivery: p.delivery,
    isNew: p.isNew,
  };
}

export function runQuery(
  all: Product[],
  q: CatalogQuery,
  ctx: EngineContext,
  popularity: (p: Product) => number = (p) => p.reviewCount * 10 + p.averageRating,
): ProductList {
  const scope = q.category ? descendantSlugs(q.category, ctx.categories) : null;
  const matched = sortProducts(
    all.filter((p) => passes(p, q, scope)),
    q,
    popularity,
  );
  const pageCount = Math.max(1, Math.ceil(matched.length / q.perPage));
  const page = Math.min(Math.max(1, q.page), pageCount);
  return {
    items: matched.slice((page - 1) * q.perPage, page * q.perPage).map(toSummary),
    total: matched.length,
    page,
    pageCount,
    facets: buildFacets(all, q, scope, ctx),
  };
}
