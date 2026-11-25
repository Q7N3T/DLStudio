import { describe, expect, it } from "vitest";
import products from "@/mocks/store-api/products.json";
import { compareSizes } from "./engine";
import { MockProvider } from "./mock-provider";
import { defaultQuery } from "./query";
import type { StoreProduct } from "./store-api";

const catalog = new MockProvider();
const all = () => catalog.listProducts(defaultQuery({ inStockOnly: false, perPage: 1000 }));

describe("mock fixtures: data consistency", () => {
  const raw = products as StoreProduct[];

  it("has ~40 products covering both delivery types, sold-out items and variations", async () => {
    const { items, total } = await all();
    expect(total).toBeGreaterThanOrEqual(40);
    expect(items.some((p) => p.delivery === "russia")).toBe(true);
    expect(items.some((p) => p.delivery === "china")).toBe(true);
    expect(items.some((p) => !p.inStock)).toBe(true);
    expect(items.some((p) => p.colors.length > 1 && p.sizes.length > 1)).toBe(true);
  });

  it("uses unique ids and slugs", () => {
    expect(new Set(raw.map((p) => p.id)).size).toBe(raw.length);
    expect(new Set(raw.map((p) => p.slug)).size).toBe(raw.length);
  });

  it("references only existing categories", async () => {
    const slugs = new Set((await catalog.getCategories()).map((c) => c.slug));
    for (const p of raw) for (const c of p.categories) expect(slugs, `${p.slug}`).toContain(c.slug);
  });

  it("variations only use terms declared in the product attributes", () => {
    for (const p of raw) {
      for (const v of p.variations) {
        for (const a of v.attributes) {
          const attr = p.attributes.find((x) => x.name === a.name);
          expect(
            attr?.terms.map((t) => t.slug),
            `${p.slug} ${a.name}`,
          ).toContain(a.value);
        }
      }
    }
  });

  it("resolves a studio, a title and a product type for every product", async () => {
    for (const id of raw.map((p) => p.id)) {
      const [p] = await catalog.getProductsByIds([id]);
      expect(p.studio, p.slug).not.toBeNull();
      expect(p.title).not.toMatch(/&#|«|»/);
      expect(p.productType).not.toBe("");
    }
  });

  it("keeps prices positive and sale prices below regular", async () => {
    for (const p of (await all()).items) {
      expect(p.price.current).toBeGreaterThan(0);
      if (p.onSale) expect(p.price.current).toBeLessThan(p.price.regular);
      if (p.price.min !== undefined) expect(p.price.min).toBeLessThan(p.price.max!);
    }
  });

  it("Russia items in stock keep at least one available size", async () => {
    for (const p of (await all()).items) {
      if (p.delivery === "russia" && p.inStock && p.sizes.length) {
        expect(
          p.sizes.some((s) => s.inStock),
          p.slug,
        ).toBe(true);
      }
    }
  });

  it("marks exactly 8 newest products as NEW", async () => {
    const { items } = await all();
    const newest = [...items].sort((a, b) => b.id - a.id).slice(0, 8);
    expect(
      items
        .filter((p) => p.isNew)
        .map((p) => p.id)
        .sort(),
    ).toEqual(newest.map((p) => p.id).sort());
  });
});

describe("MockProvider.listProducts", () => {
  it("hides sold-out items by default and puts them last otherwise", async () => {
    const def = await catalog.listProducts(defaultQuery({ perPage: 1000 }));
    expect(def.items.every((p) => p.inStock)).toBe(true);
    const { items } = await all();
    const firstSold = items.findIndex((p) => !p.inStock);
    expect(firstSold).toBeGreaterThan(0);
    expect(items.slice(firstSold).every((p) => !p.inStock)).toBe(true);
  });

  it("includes subcategories when filtering by a parent category", async () => {
    const { items } = await catalog.listProducts(
      defaultQuery({ category: "shoes-man", perPage: 100 }),
    );
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => /Ботинки|Кроссовки|Кеды/.test(p.productType))).toBe(true);
  });

  it("filters by gender but keeps unisex items", async () => {
    const { items } = await catalog.listProducts(defaultQuery({ gender: "woman", perPage: 100 }));
    const full = await Promise.all(items.map((p) => catalog.getProduct(p.slug)));
    expect(full.every((p) => p!.gender !== "man")).toBe(true);
    expect(full.some((p) => p!.gender === "unisex")).toBe(true);
  });

  it("filters by available size only", async () => {
    const { items } = await catalog.listProducts(defaultQuery({ sizes: ["S"], perPage: 100 }));
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.sizes.some((s) => s.value === "S" && s.inStock))).toBe(true);
  });

  it("combines delivery, studio and price filters", async () => {
    const { items } = await catalog.listProducts(
      defaultQuery({
        delivery: ["china"],
        studios: ["hanqiaoriji"],
        priceMax: 14000,
        perPage: 100,
      }),
    );
    expect(items.length).toBeGreaterThan(0);
    for (const p of items) {
      expect(p.delivery).toBe("china");
      expect(p.studio?.slug).toBe("hanqiaoriji");
      expect(p.price.min ?? p.price.current).toBeLessThanOrEqual(14000);
    }
  });

  it("sorts by price both ways", async () => {
    const price = (p: { price: { min?: number; current: number } }) =>
      p.price.min ?? p.price.current;
    const asc = (
      await catalog.listProducts(defaultQuery({ sort: "price-asc", perPage: 100 }))
    ).items.map(price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = (
      await catalog.listProducts(defaultQuery({ sort: "price-desc", perPage: 100 }))
    ).items.map(price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("paginates and clamps the page number", async () => {
    const p1 = await catalog.listProducts(defaultQuery({ perPage: 10 }));
    const p2 = await catalog.listProducts(defaultQuery({ perPage: 10, page: 2 }));
    expect(p1.items).toHaveLength(10);
    expect(p1.items[0].id).not.toBe(p2.items[0].id);
    const tooFar = await catalog.listProducts(defaultQuery({ perPage: 10, page: 999 }));
    expect(tooFar.page).toBe(tooFar.pageCount);
  });

  it("counts a facet without applying its own filter", async () => {
    const { facets, items } = await catalog.listProducts(
      defaultQuery({ delivery: ["russia"], perPage: 100 }),
    );
    expect(items.every((p) => p.delivery === "russia")).toBe(true);
    // Фасет доставки всё ещё показывает «Из Китая», иначе его нельзя выбрать
    expect(facets.delivery.map((d) => d.value)).toEqual(["russia", "china"]);
    expect(facets.sizes.map((s) => s.value)).toEqual(
      [...facets.sizes.map((s) => s.value)].sort(compareSizes),
    );
  });

  it("searches across name, studio and type, ignoring case and ё", async () => {
    const { items } = await catalog.listProducts(
      defaultQuery({ q: "БОТИНКИ hanqiaoriji", perPage: 100 }),
    );
    expect(items.length).toBeGreaterThan(0);
    const { items: yo } = await catalog.listProducts(defaultQuery({ q: "чёрный", perPage: 100 }));
    const { items: ye } = await catalog.listProducts(defaultQuery({ q: "черный", perPage: 100 }));
    expect(yo.length).toBeGreaterThan(0);
    expect(yo.map((p) => p.id)).toEqual(ye.map((p) => p.id));
  });
});

describe("MockProvider other methods", () => {
  it("returns products by id in the requested order and skips unknown ids", async () => {
    const res = await catalog.getProductsByIds([331503, 1, 331501]);
    expect(res.map((p) => p.id)).toEqual([331503, 331501]);
  });

  it("finds related products without the product itself", async () => {
    const p = (await catalog.getProductsByIds([331503]))[0];
    const full = (await catalog.getProduct(p.slug))!;
    const { similar, sameStudio } = await catalog.getRelated(full);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.some((x) => x.id === full.id)).toBe(false);
    expect(sameStudio.every((x) => x.studio?.slug === "hanqiaoriji")).toBe(true);
  });

  it("suggests products, categories and studios", async () => {
    const s = await catalog.suggest("худи");
    expect(s.products.length).toBeGreaterThan(0);
    expect(s.categories.map((c) => c.name)).toContain("Худи");
    expect((await catalog.suggest("dazo")).studios.map((x) => x.slug)).toEqual(["dazo-studio"]);
    expect(await catalog.suggest("  ")).toEqual({ products: [], categories: [], studios: [] });
  });

  it("returns null for unknown slugs", async () => {
    expect(await catalog.getProduct("nope")).toBeNull();
    expect(await catalog.getCategory("nope")).toBeNull();
    expect(await catalog.getStudio("nope")).toBeNull();
  });
});

describe("compareSizes", () => {
  it("orders letters, numbers and the rest", () => {
    expect(["XL", "42", "S", "One size", "36", "M"].sort(compareSizes)).toEqual([
      "S",
      "M",
      "XL",
      "One size",
      "36",
      "42",
    ]);
  });
});
