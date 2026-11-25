import { COLOR_HEX } from "@/config/colors";
import { RUSSIA_CATEGORY_SLUG } from "@/config/delivery";
import type { StoreCategory, StoreProduct, StoreTag } from "./store-api";
import type { Category, Gender, Product, SizeOption, Studio, Variation } from "./types";

/** Общие данные, нужные для приведения товара: дерево категорий, студии, «новинки». */
export interface MappingContext {
  categoriesById: Map<number, StoreCategory>;
  /** Ключ — имя студии в нижнем регистре (сверка тега с pa_brand) */
  studiosByName: Map<string, Studio>;
  /** ID товаров, получающих бейдж NEW (N самых новых) */
  newIds: Set<number>;
}

const COLOR_ATTR = /^цвет$/i;
const SIZE_ATTR = /^размер$/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

/** Store API отдаёт названия с HTML-сущностями: «Пуховик &#171;…&#187;». */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Целое число рублей из строки в минорных единицах. */
export function parseAmount(value: string | null | undefined, minorUnit: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n / 10 ** minorUnit);
}

/**
 * Разбор названия «Ботинки «HANQIAORIJI Deconstructed Boots»»:
 * тип — до кавычек, внутри — студия + короткое название.
 */
export function parseProductName(
  rawName: string,
  studio: Studio | null,
): { productType: string | null; title: string; fullName: string } {
  const fullName = decodeEntities(rawName).replace(/\s+/g, " ").trim();
  const m = fullName.match(/^(.*?)\s*«(.+)»\s*$/);
  const productType = m?.[1]?.trim() || null;
  let title = (m?.[2] ?? fullName).trim();
  if (studio && title.toLowerCase().startsWith(studio.name.toLowerCase() + " ")) {
    title = title.slice(studio.name.length).trim();
  }
  return { productType, title, fullName };
}

function ancestors(id: number, byId: Map<number, StoreCategory>): StoreCategory[] {
  const chain: StoreCategory[] = [];
  const seen = new Set<number>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push(cur);
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return chain;
}

/** Пол по корневым категориям «Мужское» (man) / «Женское» (woman). */
export function genderOf(
  product: StoreProduct,
  byId: Map<number, StoreCategory>,
): Gender | "unisex" {
  const roots = new Set<string>();
  for (const c of product.categories) {
    const chain = ancestors(c.id, byId);
    const root = chain[chain.length - 1];
    if (root) roots.add(root.slug);
  }
  const man = roots.has("man");
  const woman = roots.has("woman");
  if (man && !woman) return "man";
  if (woman && !man) return "woman";
  return "unisex";
}

/** Самая глубокая категория товара, кроме служебных («Товары из России», релизы). */
function leafCategory(product: StoreProduct, byId: Map<number, StoreCategory>) {
  let best: { name: string; depth: number } | null = null;
  for (const c of product.categories) {
    if (c.slug === RUSSIA_CATEGORY_SLUG) continue;
    const depth = ancestors(c.id, byId).length;
    if (!best || depth > best.depth) best = { name: decodeEntities(c.name), depth };
  }
  return best?.name ?? null;
}

export function mapStoreProduct(raw: StoreProduct, ctx: MappingContext): Product {
  const studio =
    raw.tags
      .map((t) => ctx.studiosByName.get(decodeEntities(t.name).toLowerCase()))
      .find(Boolean) ?? null;
  const { productType, title, fullName } = parseProductName(raw.name, studio);

  const colorAttr = raw.attributes.find((a) => COLOR_ATTR.test(a.name));
  const sizeAttr = raw.attributes.find((a) => SIZE_ATTR.test(a.name));

  // Вариации ссылаются на слаг термина размера («m»), UI — на его название («M»).
  const sizeNameBySlug = new Map(
    (sizeAttr?.terms ?? []).map((t) => [t.slug, decodeEntities(t.name)] as const),
  );
  const variations: Variation[] = raw.variations.map((v) => {
    const sizeSlug = v.attributes.find((a) => SIZE_ATTR.test(a.name))?.value || undefined;
    return {
      id: v.id,
      color: v.attributes.find((a) => COLOR_ATTR.test(a.name))?.value || undefined,
      size: sizeSlug ? (sizeNameBySlug.get(sizeSlug) ?? sizeSlug) : undefined,
      // Store API не отдаёт остатки вариаций в списке. Правило (согласовано):
      // вариация существует и товар в наличии → размер доступен.
      inStock: raw.is_in_stock,
    };
  });

  const sizes: SizeOption[] = (sizeAttr?.terms ?? []).map((t) => {
    const value = decodeEntities(t.name);
    const hasVariation = raw.type !== "variable" || variations.some((v) => v.size === value);
    return { value, inStock: raw.is_in_stock && hasVariation };
  });

  const minor = raw.prices.currency_minor_unit;
  const current = parseAmount(raw.prices.price, minor);
  const regular = parseAmount(raw.prices.regular_price, minor) || current;
  const range = raw.prices.price_range;
  const min = range ? parseAmount(range.min_amount, minor) : undefined;
  const max = range ? parseAmount(range.max_amount, minor) : undefined;

  const delivery = raw.categories.some((c) => c.slug === RUSSIA_CATEGORY_SLUG) ? "russia" : "china";
  const altBase = studio ? `${studio.name} ${title}` : title;

  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku,
    fullName,
    title,
    productType: productType ?? leafCategory(raw, ctx.categoriesById) ?? "",
    studio,
    price:
      min !== undefined && max !== undefined && min !== max
        ? { current, regular, min, max }
        : { current, regular },
    onSale: raw.on_sale && regular > current,
    images: raw.images.map((img, i) => ({
      src: img.src,
      alt: img.alt?.trim() || (i === 0 ? altBase : `${altBase}, фото ${i + 1}`),
    })),
    colors: (colorAttr?.terms ?? []).map((t) => ({
      slug: t.slug,
      name: decodeEntities(t.name),
      hex: COLOR_HEX[t.slug],
    })),
    sizes,
    inStock: raw.is_in_stock,
    delivery,
    isNew: ctx.newIds.has(raw.id),
    descriptionHtml: raw.description,
    shortDescriptionHtml: raw.short_description,
    categories: raw.categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: decodeEntities(c.name),
    })),
    tags: raw.tags.map((t) => ({ id: t.id, slug: t.slug, name: decodeEntities(t.name) })),
    variations,
    gender: genderOf(raw, ctx.categoriesById),
    averageRating: Number(raw.average_rating) || 0,
    reviewCount: raw.review_count,
  };
}

export function mapStoreCategory(raw: StoreCategory): Category {
  return {
    id: raw.id,
    slug: raw.slug,
    name: decodeEntities(raw.name),
    parentId: raw.parent || null,
    count: raw.count,
    image: raw.image
      ? { src: raw.image.src, alt: raw.image.alt || decodeEntities(raw.name) }
      : undefined,
  };
}

/** Студии = теги, чьё имя совпадает с термином pa_brand (слаги на сайте местами расходятся). */
export function buildStudios(tags: StoreTag[], brandTermNames: string[]): Studio[] {
  const brands = new Set(brandTermNames.map((n) => decodeEntities(n).toLowerCase()));
  return tags
    .filter((t) => brands.has(decodeEntities(t.name).toLowerCase()))
    .map((t) => ({ id: t.id, slug: t.slug, name: decodeEntities(t.name), count: t.count }));
}

/** N самых новых: у WordPress ID растут со временем, Store API сортирует по дате. */
export function newestIds(products: Pick<StoreProduct, "id">[], n: number): Set<number> {
  return new Set(
    [...products]
      .sort((a, b) => b.id - a.id)
      .slice(0, n)
      .map((p) => p.id),
  );
}
