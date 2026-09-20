import { afterEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn() }));
vi.mock("@sentry/react", () => ({
  ...sdk,
  browserTracingIntegration: vi.fn(() => ({})),
  breadcrumbsIntegration: vi.fn(() => ({})),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("Sentry browser monitoring", () => {
  it("uses FishTankr's configured DSN when no override is supplied", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", undefined);
    vi.stubGlobal("window", {});
    const { initializeSentry } = await import("./sentry");
    initializeSentry();
    expect(sdk.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://b2b2bb0500bdf160abdfb01be60cfae0@o4512105046016000.ingest.us.sentry.io/4512105149366272",
      }),
    );
  });

  it("does not initialize or capture without a DSN or on the server", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "");
    vi.stubGlobal("window", {});
    const { captureSentryError } = await import("./sentry");
    captureSentryError(new Error("disabled"));
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.com/1");
    vi.stubGlobal("window", undefined);
    captureSentryError(new Error("server"));
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.captureException).not.toHaveBeenCalled();
  });

  it("initializes once, captures boundary errors and scrubs request data", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.com/1");
    vi.stubGlobal("window", {});
    const { initializeSentry, captureSentryError } = await import("./sentry");
    initializeSentry();
    const error = new Error("boundary");
    captureSentryError(error);
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.captureException).toHaveBeenCalledWith(error);
    const options = sdk.init.mock.calls[0][0];
    const event = options.beforeSend({
      user: { email: "private@example.com" },
      request: { url: "https://example.com/?code=secret#token", headers: {}, data: "private" },
    });
    expect(event.user).toBeUndefined();
    expect(event.request).toEqual({ url: "https://example.com/" });
  });
});
