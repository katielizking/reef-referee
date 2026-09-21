import { describe, expect, it, vi } from "vitest";
import { supportsWebGL } from "./webgl";

describe("supportsWebGL", () => {
  it("returns false when the browser cannot create a WebGL context", () => {
    const getContext = vi.fn(() => null);
    const documentRef = {
      createElement: vi.fn(() => ({ getContext }) as unknown as HTMLCanvasElement),
    } as unknown as Pick<Document, "createElement">;

    expect(supportsWebGL(documentRef)).toBe(false);
  });

  it("returns true and releases a temporary supported context", () => {
    const loseContext = vi.fn();
    const context = { getExtension: vi.fn(() => ({ loseContext })) };
    const documentRef = {
      createElement: vi.fn(
        () =>
          ({
            getContext: vi.fn(() => context),
          }) as unknown as HTMLCanvasElement,
      ),
    } as unknown as Pick<Document, "createElement">;

    expect(supportsWebGL(documentRef)).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("returns false when context creation throws", () => {
    const documentRef = {
      createElement: vi.fn(() => {
        throw new Error("canvas disabled");
      }),
    } as unknown as Pick<Document, "createElement">;

    expect(supportsWebGL(documentRef)).toBe(false);
  });
});
