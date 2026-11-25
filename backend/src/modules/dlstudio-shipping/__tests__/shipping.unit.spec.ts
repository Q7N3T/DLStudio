import { describe, expect, it } from "@jest/globals"
import DlStudioShippingProviderService from "../service"
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  itemsTotal,
  resolveTariffs,
  shippingPrice,
} from "../tariffs"

describe("tariffs", () => {
  it("sums cart items and ignores garbage", () => {
    expect(itemsTotal([{ unit_price: 7990, quantity: 2 }, { unit_price: "1390", quantity: 1 }])).toBe(17370)
    expect(itemsTotal([{ unit_price: "abc", quantity: 1 }, { unit_price: 100, quantity: 0 }])).toBe(0)
    expect(itemsTotal(undefined)).toBe(0)
  })

  it("charges the carrier tariff below the threshold", () => {
    expect(shippingPrice("cdek", 14999)).toBe(490)
    expect(shippingPrice("russian-post", 0)).toBe(390)
  })

  it("is free from the threshold inclusive", () => {
    expect(shippingPrice("cdek", DEFAULT_FREE_SHIPPING_THRESHOLD)).toBe(0)
    expect(shippingPrice("russian-post", 50000)).toBe(0)
  })

  it("supports overriding tariffs and disabling the threshold", () => {
    const options = { free_shipping_threshold: 0, tariffs: { cdek: { price: 590 } } }
    expect(shippingPrice("cdek", 100000, options)).toBe(590)
    expect(resolveTariffs(options).tariffs.cdek.name).toBe("СДЭК")
  })
})

describe("DlStudioShippingProviderService", () => {
  const provider = new DlStudioShippingProviderService({}, {})

  it("exposes both carriers and a return option", async () => {
    const options = await provider.getFulfillmentOptions()
    expect(options.map((o) => o.id)).toEqual(["cdek", "russian-post", "return"])
    expect(options.find((o) => o.id === "return")?.is_return).toBe(true)
  })

  it("validates options by carrier code", async () => {
    expect(await provider.validateOption({ carrier: "cdek" })).toBe(true)
    expect(await provider.validateOption({ id: "russian-post" })).toBe(true)
    expect(await provider.validateOption({ carrier: "dhl" })).toBe(false)
  })

  it("calculates a tax-inclusive price from cart items", async () => {
    const context = { items: [{ unit_price: 7990, quantity: 1 }] } as never
    await expect(provider.calculatePrice({ carrier: "cdek" }, {}, context)).resolves.toEqual({
      calculated_amount: 490,
      is_calculated_price_tax_inclusive: true,
    })
    const rich = { items: [{ unit_price: 8000, quantity: 2 }] } as never
    await expect(provider.calculatePrice({ id: "russian-post" }, {}, rich)).resolves.toMatchObject({
      calculated_amount: 0,
    })
  })

  it("rejects unknown carriers", async () => {
    await expect(provider.calculatePrice({ carrier: "dhl" }, {}, {} as never)).rejects.toThrow(
      "Неизвестный перевозчик"
    )
    await expect(provider.validateFulfillmentData({ carrier: "dhl" }, {})).rejects.toThrow()
  })

  it("issues a stub tracking number", async () => {
    const res = await provider.createFulfillment({ carrier: "russian-post" })
    expect(res.data).toMatchObject({ carrier: "russian-post", stub: true })
    expect(String(res.data?.tracking_number)).toMatch(/^RP-[0-9A-F]{10}$/)
  })
})
