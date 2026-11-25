import { describe, expect, it } from "vitest";
import { shoeSizeForFoot } from "./size-guide";

describe("shoeSizeForFoot", () => {
  it("matches exact lengths", () => {
    expect(shoeSizeForFoot(25)).toBe("40");
  });
  it("rounds up between sizes", () => {
    expect(shoeSizeForFoot(25.2)).toBe("41");
  });
  it("handles the edges", () => {
    expect(shoeSizeForFoot(20)).toBe("35");
    expect(shoeSizeForFoot(30)).toBeNull();
    expect(shoeSizeForFoot(0)).toBeNull();
    expect(shoeSizeForFoot(Number.NaN)).toBeNull();
  });
});
