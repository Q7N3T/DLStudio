import { describe, expect, it } from "vitest";
import { defaultQuery, parseCatalogParams, serializeCatalogQuery } from "./query";

describe("parseCatalogParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseCatalogParams(new URLSearchParams())).toEqual(defaultQuery());
  });

  it("parses every filter", () => {
    const q = parseCatalogParams(
      new URLSearchParams(
        "size=M,L&color=black&studio=dazo-studio,19-studio&delivery=russia&price=5000-15000&stock=all&sort=new&page=2&q=куртка",
      ),
    );
    expect(q).toMatchObject({
      sizes: ["M", "L"],
      colors: ["black"],
      studios: ["dazo-studio", "19-studio"],
      delivery: ["russia"],
      priceMin: 5000,
      priceMax: 15000,
      inStockOnly: false,
      sort: "new",
      page: 2,
      q: "куртка",
    });
  });

  it("accepts Next.js searchParams objects", () => {
    expect(parseCatalogParams({ size: ["S", "M"], sort: "price-asc" })).toMatchObject({
      sizes: ["S"],
      sort: "price-asc",
    });
  });

  it("ignores garbage", () => {
    const q = parseCatalogParams(
      new URLSearchParams("delivery=mars,china&sort=cheap&page=-3&price=abc-&size=,,M,M"),
    );
    expect(q.delivery).toEqual(["china"]);
    expect(q.sort).toBe("popular");
    expect(q.page).toBe(1);
    expect(q.priceMin).toBeUndefined();
    expect(q.sizes).toEqual(["M"]);
  });

  it("swaps an inverted price range and supports open bounds", () => {
    expect(parseCatalogParams(new URLSearchParams("price=9000-3000"))).toMatchObject({
      priceMin: 3000,
      priceMax: 9000,
    });
    expect(parseCatalogParams(new URLSearchParams("price=-8000"))).toMatchObject({
      priceMin: undefined,
      priceMax: 8000,
    });
  });

  it("keeps base values from the route", () => {
    expect(parseCatalogParams(new URLSearchParams(), { category: "hoodie" }).category).toBe(
      "hoodie",
    );
  });
});

describe("serializeCatalogQuery", () => {
  it("omits defaults", () => {
    expect(serializeCatalogQuery(defaultQuery())).toBe("");
  });

  it("round-trips through parse", () => {
    const original = defaultQuery({
      sizes: ["M"],
      colors: ["black", "white"],
      delivery: ["russia"],
      priceMax: 10000,
      inStockOnly: false,
      sort: "price-desc",
      page: 3,
      q: "худи dazo",
    });
    const parsed = parseCatalogParams(
      new URLSearchParams(serializeCatalogQuery(original).slice(1)),
    );
    expect(parsed).toEqual(original);
  });
});
