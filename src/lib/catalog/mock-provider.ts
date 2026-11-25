import brandTermsJson from "@/mocks/store-api/brand-terms.json";
import categoriesJson from "@/mocks/store-api/categories.json";
import productsJson from "@/mocks/store-api/products.json";
import tagsJson from "@/mocks/store-api/tags.json";
import { descendantSlugs, runQuery, toSummary } from "./engine";
import {
  buildStudios,
  decodeEntities,
  mapStoreCategory,
  mapStoreProduct,
  newestIds,
  type MappingContext,
} from "./mapping";
import type { CatalogProvider } from "./provider";
import { defaultQuery } from "./query";
import type { StoreAttributeTerm, StoreCategory, StoreProduct, StoreTag } from "./store-api";
import type { CatalogQuery, Category, Product, Studio, Tag } from "./types";

export interface MockData {
  products: StoreProduct[];
  categories: StoreCategory[];
  tags: StoreTag[];
  brandTerms: StoreAttributeTerm[];
}

/** В моках 42 товара: бейдж NEW получают 8 самых новых (на сайте — config NEW_PRODUCTS_COUNT). */
const MOCK_NEW_COUNT = 8;

/**
 * Провайдер на JSON-фикстурах со схемой Store API.
 * Сырые данные проходят через тот же маппинг, что будет у WooProvider,
 * так что ошибки приведения ловятся уже на моках.
 */
export class MockProvider implements CatalogProvider {
  readonly name = "mock" as const;
  private readonly products: Product[];
  private readonly categories: Category[];
  private readonly studios: Studio[];
  private readonly tags: Tag[];

  constructor(
    data: MockData = {
      products: productsJson as StoreProduct[],
      categories: categoriesJson as StoreCategory[],
      tags: tagsJson as StoreTag[],
      brandTerms: brandTermsJson as StoreAttributeTerm[],
    },
    options: { newCount?: number } = {},
  ) {
    this.categories = data.categories.map(mapStoreCategory);
    this.studios = buildStudios(
      data.tags,
      data.brandTerms.map((t) => t.name),
    );
    this.tags = data.tags.map((t) => ({ id: t.id, slug: t.slug, name: decodeEntities(t.name) }));
    const ctx: MappingContext = {
      categoriesById: new Map(data.categories.map((c) => [c.id, c])),
      studiosByName: new Map(this.studios.map((s) => [s.name.toLowerCase(), s])),
      newIds: newestIds(data.products, options.newCount ?? MOCK_NEW_COUNT),
    };
    this.products = data.products.map((p) => mapStoreProduct(p, ctx));
  }

  async listProducts(query: CatalogQuery) {
    return runQuery(this.products, query, { categories: this.categories });
  }

  async getProduct(slug: string) {
    return this.products.find((p) => p.slug === slug) ?? null;
  }

  async getProductsByIds(ids: number[]) {
    const byId = new Map(this.products.map((p) => [p.id, p]));
    return ids.flatMap((id) => {
      const p = byId.get(id);
      return p ? [toSummary(p)] : [];
    });
  }

  async getRelated(product: Product, limit = 8) {
    const leaf = this.leafCategorySlug(product);
    const scope = leaf ? descendantSlugs(leaf, this.categories) : new Set<string>();
    const others = this.products.filter((p) => p.id !== product.id);
    const rank = (a: Product, b: Product) => Number(b.inStock) - Number(a.inStock) || b.id - a.id;

    const similar = others
      .filter(
        (p) =>
          p.categories.some((c) => scope.has(c.slug)) &&
          (p.gender === product.gender || p.gender === "unisex" || product.gender === "unisex"),
      )
      .sort(rank)
      .slice(0, limit)
      .map(toSummary);
    const sameStudio = product.studio
      ? others
          .filter((p) => p.studio?.slug === product.studio!.slug)
          .sort(rank)
          .slice(0, limit)
          .map(toSummary)
      : [];
    return { similar, sameStudio };
  }

  async getCategories() {
    return this.categories;
  }

  async getCategory(slug: string) {
    return this.categories.find((c) => c.slug === slug) ?? null;
  }

  async getStudios() {
    return this.studios;
  }

  async getStudio(slug: string) {
    return this.studios.find((s) => s.slug === slug) ?? null;
  }

  async getTag(slug: string) {
    return this.tags.find((t) => t.slug === slug) ?? null;
  }

  async suggest(q: string, limit = 6) {
    const needle = q.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
    if (!needle) return { products: [], categories: [], studios: [] };
    const has = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е").includes(needle);
    const { items } = await this.listProducts(defaultQuery({ q, perPage: limit }));
    return {
      products: items,
      categories: this.categories
        .filter((c) => c.count > 0 && has(c.name) && c.slug !== "warehouse-in-russia")
        .slice(0, 4),
      studios: this.studios.filter((s) => has(s.name)).slice(0, 4),
    };
  }

  /** Самая глубокая «товарная» категория (без служебных). */
  private leafCategorySlug(product: Product): string | null {
    const depth = (slug: string) => {
      let d = 0;
      let cur = this.categories.find((c) => c.slug === slug);
      while (cur) {
        d++;
        cur = cur.parentId ? this.categories.find((c) => c.id === cur!.parentId) : undefined;
      }
      return d;
    };
    const candidates = product.categories
      .map((c) => c.slug)
      .filter((s) => s !== "warehouse-in-russia" && s !== "final-winter-edit");
    return candidates.sort((a, b) => depth(b) - depth(a))[0] ?? null;
  }
}
