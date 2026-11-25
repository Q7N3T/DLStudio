import { describe, expect, it } from "vitest";
import {
  buildStudios,
  decodeEntities,
  genderOf,
  mapStoreProduct,
  newestIds,
  parseAmount,
  parseProductName,
  type MappingContext,
} from "./mapping";
import type { StoreCategory, StoreProduct } from "./store-api";

const cat = (id: number, parent: number, slug: string, name = slug): StoreCategory => ({
  id,
  parent,
  slug,
  name,
  description: "",
  count: 0,
  image: null,
  permalink: "",
});

const CATS = [
  cat(57, 0, "man", "Мужское"),
  cat(58, 0, "woman", "Женское"),
  cat(236, 57, "top-man", "Верх"),
  cat(72, 236, "outerwear", "Верхняя одежда"),
  cat(213, 72, "down-jacket-man", "Пуховики"),
  cat(210, 0, "accessories", "Аксессуары"),
  cat(139, 0, "warehouse-in-russia", "Товары из России"),
];
const studio = { id: 1, slug: "19-studio", name: "19 Studio" };
const ctx: MappingContext = {
  categoriesById: new Map(CATS.map((c) => [c.id, c])),
  studiosByName: new Map([["19 studio", studio]]),
  newIds: new Set([10]),
};

/** Сокращённая копия реального ответа Store API (пуховик со склада в России). */
function rawProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 10,
    name: "Пуховик &#171;19 Studio Embroidery Plaid Down Jacket&#187;",
    slug: "19-studio-embroidery-plaid-down-jacket",
    parent: 0,
    type: "variable",
    permalink: "",
    sku: "DL-1",
    short_description: "",
    description: "",
    on_sale: true,
    prices: {
      price: "7990",
      regular_price: "18990",
      sale_price: "7990",
      price_range: null,
      currency_code: "RUB",
      currency_minor_unit: 0,
    },
    average_rating: "0",
    review_count: 0,
    images: [
      { id: 1, src: "/a.jpg", thumbnail: "", srcset: "", sizes: "", name: "", alt: "" },
      { id: 2, src: "/b.jpg", thumbnail: "", srcset: "", sizes: "", name: "", alt: "Спина" },
    ],
    categories: [
      { id: 213, name: "Пуховики", slug: "down-jacket-man" },
      { id: 139, name: "Товары из России", slug: "warehouse-in-russia" },
    ],
    tags: [{ id: 1, name: "19 Studio", slug: "19-studio" }],
    attributes: [
      {
        id: 3,
        name: "Цвет",
        taxonomy: "pa_color",
        has_variations: true,
        terms: [{ id: 1, name: "Голубой", slug: "sky" }],
      },
      {
        id: 4,
        name: "Размер",
        taxonomy: "pa_size",
        has_variations: true,
        terms: [
          { id: 2, name: "S", slug: "s" },
          { id: 3, name: "M", slug: "m" },
          { id: 4, name: "L", slug: "l" },
        ],
      },
    ],
    variations: [
      {
        id: 99,
        attributes: [
          { name: "Цвет", value: "sky" },
          { name: "Размер", value: "m" },
        ],
      },
    ],
    is_purchasable: true,
    is_in_stock: true,
    is_on_backorder: false,
    low_stock_remaining: 1,
    ...overrides,
  };
}

describe("decodeEntities", () => {
  it("decodes numeric and named entities", () => {
    expect(decodeEntities("Пуховик &#171;X&#187;")).toBe("Пуховик «X»");
    expect(decodeEntities("A &amp; B &laquo;C&raquo; &#x2014;")).toBe("A & B «C» —");
  });
  it("leaves unknown entities untouched", () => {
    expect(decodeEntities("&unknown; &#xZZ;")).toBe("&unknown; &#xZZ;");
  });
});

describe("parseAmount", () => {
  it("respects minor units", () => {
    expect(parseAmount("14590", 0)).toBe(14590);
    expect(parseAmount("1459000", 2)).toBe(14590);
    expect(parseAmount(null, 0)).toBe(0);
    expect(parseAmount("abc", 0)).toBe(0);
  });
});

describe("parseProductName", () => {
  it("splits type, studio and title", () => {
    expect(
      parseProductName("Ботинки «HANQIAORIJI Boxing Boots»", {
        id: 1,
        slug: "h",
        name: "HANQIAORIJI",
      }),
    ).toEqual({
      productType: "Ботинки",
      title: "Boxing Boots",
      fullName: "Ботинки «HANQIAORIJI Boxing Boots»",
    });
  });
  it("works without quotes and without studio", () => {
    expect(parseProductName("Подарочный сертификат", null)).toEqual({
      productType: null,
      title: "Подарочный сертификат",
      fullName: "Подарочный сертификат",
    });
  });
  it("does not strip a studio name that is only a prefix of a word", () => {
    expect(parseProductName("Худи «DLX Hoodie»", { id: 1, slug: "dl", name: "DL" }).title).toBe(
      "DLX Hoodie",
    );
  });
});

describe("genderOf", () => {
  const byId = ctx.categoriesById;
  it("walks up to the root category", () => {
    expect(genderOf(rawProduct(), byId)).toBe("man");
  });
  it("is unisex without a gender root or with both", () => {
    expect(
      genderOf(rawProduct({ categories: [{ id: 210, name: "", slug: "accessories" }] }), byId),
    ).toBe("unisex");
    expect(
      genderOf(
        rawProduct({
          categories: [
            { id: 213, name: "", slug: "down-jacket-man" },
            { id: 58, name: "", slug: "woman" },
          ],
        }),
        byId,
      ),
    ).toBe("unisex");
  });
});

describe("mapStoreProduct", () => {
  const p = mapStoreProduct(rawProduct(), ctx);

  it("decodes the name and extracts studio, title and type", () => {
    expect(p.fullName).toBe("Пуховик «19 Studio Embroidery Plaid Down Jacket»");
    expect(p.studio).toEqual(studio);
    expect(p.title).toBe("Embroidery Plaid Down Jacket");
    expect(p.productType).toBe("Пуховик");
  });

  it("marks only sizes that have a variation as in stock", () => {
    expect(p.sizes).toEqual([
      { value: "S", inStock: false },
      { value: "M", inStock: true },
      { value: "L", inStock: false },
    ]);
    expect(p.variations).toEqual([{ id: 99, color: "sky", size: "M", inStock: true }]);
  });

  it("derives delivery, sale and NEW", () => {
    expect(p.delivery).toBe("russia");
    expect(p.price).toEqual({ current: 7990, regular: 18990 });
    expect(p.onSale).toBe(true);
    expect(p.isNew).toBe(true);
    expect(p.gender).toBe("man");
  });

  it("fills missing alt texts", () => {
    expect(p.images[0].alt).toBe("19 Studio Embroidery Plaid Down Jacket");
    expect(p.images[1].alt).toBe("Спина");
  });

  it("marks every size unavailable when the product is out of stock", () => {
    const sold = mapStoreProduct(rawProduct({ is_in_stock: false }), ctx);
    expect(sold.sizes.every((s) => !s.inStock)).toBe(true);
    expect(sold.inStock).toBe(false);
  });

  it("keeps price ranges and ignores degenerate ones", () => {
    const ranged = mapStoreProduct(
      rawProduct({
        on_sale: false,
        prices: {
          ...rawProduct().prices,
          price: "9990",
          regular_price: "9990",
          price_range: { min_amount: "9990", max_amount: "12490" },
        },
      }),
      ctx,
    );
    expect(ranged.price).toEqual({ current: 9990, regular: 9990, min: 9990, max: 12490 });
    expect(ranged.onSale).toBe(false);
    const flat = mapStoreProduct(
      rawProduct({
        prices: { ...rawProduct().prices, price_range: { min_amount: "7990", max_amount: "7990" } },
      }),
      ctx,
    );
    expect(flat.price.min).toBeUndefined();
  });

  it("treats a product from China when not in the Russia category", () => {
    const china = mapStoreProduct(
      rawProduct({ categories: [{ id: 213, name: "Пуховики", slug: "down-jacket-man" }] }),
      ctx,
    );
    expect(china.delivery).toBe("china");
  });

  it("falls back to the leaf category name for the product type", () => {
    const noType = mapStoreProduct(rawProduct({ name: "19 Studio Something" }), ctx);
    expect(noType.productType).toBe("Пуховики");
  });
});

describe("buildStudios", () => {
  it("matches tags to brand terms by name, not slug", () => {
    const studios = buildStudios(
      [
        { id: 1, name: "(un)follow", slug: "unfollow", count: 5 },
        { id: 2, name: "Streetwear Essentials", slug: "streetwear-essentials", count: 9 },
      ],
      ["(un)follow"],
    );
    expect(studios).toEqual([{ id: 1, slug: "unfollow", name: "(un)follow", count: 5 }]);
  });
});

describe("newestIds", () => {
  it("takes the N highest ids", () => {
    expect([...newestIds([{ id: 3 }, { id: 10 }, { id: 7 }], 2)].sort()).toEqual([10, 7].sort());
  });
});
