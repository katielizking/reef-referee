import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { forgetGuestClaim, readGuestClaim, rememberGuest } from "./account";

afterEach(() => vi.unstubAllGlobals());
describe("guest proof storage", () => {
  it("is safe during server rendering", () => {
    expect(readGuestClaim()).toBeNull();
    expect(() => forgetGuestClaim()).not.toThrow();
  });
  it("does not break authentication when browser storage throws", () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("Blocked");
      },
    });
    expect(() => rememberGuest({ id: "guest", is_anonymous: true } as User, "proof")).not.toThrow();
    expect(readGuestClaim()).toBeNull();
    expect(() => forgetGuestClaim()).not.toThrow();
  });
  it("records guest proof without replacing it with member credentials", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: (key: string, value: string) => values.set(key, value),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
      },
    });
    rememberGuest({ id: "guest", is_anonymous: true } as User, "guest-proof");
    rememberGuest({ id: "member", is_anonymous: false } as User, "member-proof");
    expect(readGuestClaim()).toEqual({ guestId: "guest", guestToken: "guest-proof" });
    forgetGuestClaim();
    expect(readGuestClaim()).toBeNull();
  });
});
