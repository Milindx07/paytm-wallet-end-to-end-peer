import { describe, expect, it } from "vitest";
import { formatPaise, toPaise } from "../src/utils/money.js";

describe("money utilities", () => {
  it("formats paise as INR", () => {
    expect(formatPaise(125000)).toContain("1,250.00");
  });

  it("converts rupees to paise", () => {
    expect(toPaise(12.5)).toBe(1250);
  });
});
