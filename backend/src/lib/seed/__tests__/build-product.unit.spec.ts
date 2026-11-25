import { describe, expect, it } from "@jest/globals"
import { CHINA_STOCK, ONE_SIZE, prepareProduct, RUSSIA_STOCK, toHandle } from "../build-product"
import { NON_CATEGORY_SLUGS, orderedCategories, SEED_COLLECTIONS } from "../catalog-structure"
import { SNAPSHOT, type SnapshotProduct } from "../snapshot"

const details = {
  paragraphs: ["Абзац 1", "Абзац 2"],
  season: "Коллекция осень-зима 2025",
  model_params: [],
  size_chart: { columns: ["", "Грудь"], rows: [["M", "120"]] },
  size_chart_note: null,
  composition: ["100% хлопок."],
  care: "Стирка при 30°С.",
  temperature: null,
  features: [],
}

const base: SnapshotProduct = {
  ref: 1,
  slug: "dazo-washed-hoodie-dl-1",
  sku: "DL-1",
  name: "Худи «DAZO Studio Washed Hoodie»",
  type: "Худи",
  title: "Washed Hoodie",
  studio: "dazo-studio",
  categories: ["hoodie"],
  russia: false,
  collections: [],
  releases: [],
  in_stock: true,
  price: 8990,
  sale_price: null,
  colors: [
    { slug: "black", name: "Чёрный" },
    { slug: "gray", name: "Серый" },
  ],
  sizes: ["S", "M"],
  variations: [
    { color: "black", size: "S" },
    { color: "black", size: "M" },
    { color: "gray", size: "M" },
  ],
  images: [{ url: "https://dlstudio.store/a.webp", alt: "" }],
  details,
  permalink: "https://dlstudio.store/product/x/",
}

describe("prepareProduct", () => {
  it("uses existing variations only, with RU option names and unique SKUs", () => {
    const p = prepareProduct(base)
    expect(p.handle).toBe("dazo-washed-hoodie-dl-1")
    expect(p.title).toBe("Худи «DAZO Studio Washed Hoodie»")
    expect(p.subtitle).toBe("Худи")
    expect(p.options).toEqual([
      { title: "Цвет", values: ["Чёрный", "Серый"] },
      { title: "Размер", values: ["S", "M"] },
    ])
    expect(p.variants.map((v) => v.title)).toEqual(["Чёрный / S", "Чёрный / M", "Серый / M"])
    expect(new Set(p.variants.map((v) => v.sku)).size).toBe(3)
    expect(p.variants[0].stock).toEqual({ china: CHINA_STOCK, russia: 0 })
  })

  it("splits the description from the structured details", () => {
    const p = prepareProduct(base)
    expect(p.description).toBe("Абзац 1\n\nАбзац 2")
    expect(p.details).not.toHaveProperty("paragraphs")
    expect(p.details.composition).toEqual(["100% хлопок."])
  })

  it("puts Russia stock in Moscow only", () => {
    const p = prepareProduct({ ...base, russia: true })
    expect(p.origin).toBe("russia")
    expect(p.variants.every((v) => v.stock.china === 0 && v.stock.russia === RUSSIA_STOCK)).toBe(true)
  })

  it("keeps sold-out products at zero stock", () => {
    const p = prepareProduct({ ...base, in_stock: false })
    expect(p.variants.every((v) => v.stock.china === 0 && v.stock.russia === 0)).toBe(true)
  })

  it("applies sale prices only when lower than the regular price", () => {
    expect(prepareProduct({ ...base, sale_price: 7990 }).variants[0].salePrice).toBe(7990)
    expect(prepareProduct({ ...base, sale_price: 9990 }).variants[0].salePrice).toBeUndefined()
  })

  it("builds one variant for simple products", () => {
    const colorOnly = prepareProduct({ ...base, variations: [], sizes: [], colors: [{ slug: "black", name: "Чёрный" }] })
    expect(colorOnly.options).toEqual([{ title: "Цвет", values: ["Чёрный"] }])
    expect(colorOnly.variants.map((v) => v.title)).toEqual(["Чёрный"])
    const bare = prepareProduct({ ...base, variations: [], sizes: [], colors: [] })
    expect(bare.options).toEqual([{ title: "Размер", values: [ONE_SIZE] }])
  })

  it("fills a missing option value so every variant covers every option", () => {
    const p = prepareProduct({ ...base, variations: [{ color: "black", size: "S" }, { color: null, size: "M" }] })
    expect(p.variants.map((v) => v.options)).toEqual([
      { Цвет: "Чёрный", Размер: "S" },
      { Цвет: "Чёрный", Размер: "M" },
    ])
  })
})

describe("toHandle", () => {
  it("keeps ASCII slugs as they are", () => {
    expect(toHandle("hanqiaoriji-deconstructed-boots-dl-14082")).toBe("hanqiaoriji-deconstructed-boots-dl-14082")
  })
  it("decodes and transliterates percent-encoded Cyrillic slugs", () => {
    expect(toHandle("%d1%80%d0%b5%d0%bc%d0%b5%d0%bd%d1%8c-19-studio-belt")).toBe("remen-19-studio-belt")
    expect(toHandle("Шарф Ёлка")).toBe("sharf-elka")
  })
  it("survives broken encoding", () => {
    expect(toHandle("%E0%A4%A-x")).toBe("e0-a4-a-x")
  })
})

describe("snapshot consistency", () => {
  const categories = new Set(orderedCategories(SNAPSHOT.categories).map((c) => c.handle))
  const studios = new Set(SNAPSHOT.studios.map((s) => s.handle))
  const collections = new Set(SEED_COLLECTIONS.map((c) => c.handle))

  it("has enough products of every kind", () => {
    const P = SNAPSHOT.products
    expect(P.length).toBeGreaterThanOrEqual(60)
    expect(P.filter((p) => p.russia && p.in_stock).length).toBeGreaterThanOrEqual(10)
    expect(P.filter((p) => !p.in_stock).length).toBeGreaterThanOrEqual(2)
    expect(P.filter((p) => p.sale_price).length).toBeGreaterThanOrEqual(5)
    expect(P.every((p) => p.images.length > 0)).toBe(true)
  })

  it("references known categories, studios and collections", () => {
    for (const p of SNAPSHOT.products) {
      for (const c of p.categories) if (!NON_CATEGORY_SLUGS.has(c)) expect(categories.has(c)).toBe(true)
      if (p.studio) expect(studios.has(p.studio)).toBe(true)
      for (const c of p.collections) expect(collections.has(c)).toBe(true)
    }
  })

  it("orders categories parents first", () => {
    const ordered = orderedCategories(SNAPSHOT.categories)
    const pos = new Map(ordered.map((c, i) => [c.handle, i]))
    for (const c of ordered) if (c.parent && pos.has(c.parent)) expect(pos.get(c.parent)!).toBeLessThan(pos.get(c.handle)!)
  })

  it("produces unique handles and SKUs and valid variants for the whole snapshot", () => {
    const prepared = SNAPSHOT.products.map(prepareProduct)
    const handles = prepared.map((p) => p.handle)
    for (const h of handles) expect(h).toMatch(/^[a-z0-9-]+$/)
    const skus = prepared.flatMap((p) => p.variants.map((v) => v.sku))
    expect(new Set(handles).size).toBe(handles.length)
    expect(new Set(skus).size).toBe(skus.length)
    for (const p of prepared) {
      const titles = p.options.map((o) => o.title).sort()
      for (const v of p.variants) {
        expect(Object.keys(v.options).sort()).toEqual(titles)
        for (const o of p.options) expect(o.values).toContain(v.options[o.title])
      }
    }
  })
})
