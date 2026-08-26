import { describe, expect, it } from "vitest";
import { scoreTank } from "./index";

describe("scoring module", () => {
  it("exports the tank scoring function", () => {
    expect(typeof scoreTank).toBe("function");
  });
});
