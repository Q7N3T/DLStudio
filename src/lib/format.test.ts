import { describe, expect, it } from "vitest";
import {
  formatDeliveryBadge,
  formatDeliveryWindow,
  formatPrice,
  formatPriceRange,
  pluralize,
} from "./format";

const sp = (s: string) => s.replace(/ /g, " ");

describe("formatPrice", () => {
  it("groups thousands and appends ₽", () => {
    expect(sp(formatPrice(14590))).toBe("14 590 ₽");
    expect(sp(formatPrice(990))).toBe("990 ₽");
    expect(sp(formatPrice(1250000))).toBe("1 250 000 ₽");
  });
  it("uses non-breaking spaces", () => {
    expect(formatPrice(14590)).toBe("14 590 ₽");
  });
  it("rounds fractions", () => {
    expect(sp(formatPrice(999.6))).toBe("1 000 ₽");
  });
});

describe("formatPriceRange", () => {
  it("collapses equal bounds", () => {
    expect(sp(formatPriceRange(5000, 5000))).toBe("5 000 ₽");
  });
  it("supports from- and range-style", () => {
    expect(sp(formatPriceRange(9990, 12490))).toBe("от 9 990 ₽");
    expect(sp(formatPriceRange(9990, 12490, "range"))).toBe("9 990 – 12 490 ₽");
  });
});

describe("delivery", () => {
  it("formats the badge from config", () => {
    expect(sp(formatDeliveryBadge("russia"))).toBe("Из России · 3–5 дней");
    expect(sp(formatDeliveryBadge("china"))).toBe("Из Китая · 14–25 дней");
  });
  it("formats a window within one month", () => {
    expect(sp(formatDeliveryWindow("russia", new Date(2026, 11, 1)))).toBe("~4–6 декабря");
  });
  it("rolls into the next year", () => {
    expect(sp(formatDeliveryWindow("china", new Date(2026, 11, 20)))).toBe("~3–14 января");
  });
  it("formats a window across months", () => {
    expect(sp(formatDeliveryWindow("russia", new Date(2026, 10, 27)))).toBe(
      "~30 ноября – 2 декабря",
    );
  });
});

describe("pluralize", () => {
  const f: [string, string, string] = ["товар", "товара", "товаров"];
  it.each([
    [1, "товар"],
    [2, "товара"],
    [5, "товаров"],
    [11, "товаров"],
    [21, "товар"],
    [104, "товара"],
    [112, "товаров"],
  ])("%i → %s", (n, expected) => {
    expect(pluralize(n, f)).toBe(expected);
  });
});
