import { describe, expect, it } from "vitest";
import { displayLength, formatVolume, lengthToCm, litresToGallons } from "./units";

describe("display units", () => {
  it("leaves metric values alone", () => {
    expect(displayLength(90, "metric")).toBe(90);
    expect(formatVolume(162, "metric")).toBe("162 L");
    expect(lengthToCm(90, "metric")).toBe(90);
  });

  it("converts to inches and US gallons", () => {
    expect(displayLength(30.48, "us")).toBe(12);
    expect(Math.round(litresToGallons(189.27))).toBe(50);
    expect(formatVolume(189.27, "us")).toBe("50 gal");
  });

  it("round-trips a typed imperial value back to centimetres", () => {
    expect(Math.round(lengthToCm(36, "us"))).toBe(91);
  });
});
