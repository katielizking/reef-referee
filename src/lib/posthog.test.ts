import { afterEach, describe, expect, it, vi } from "vitest";

const { init } = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { init } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  init.mockClear();
});

function configure() {
  vi.stubGlobal("window", {});
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
  vi.stubEnv("VITE_POSTHOG_HOST", "https://eu.i.posthog.com");
}

describe("PostHog initialization", () => {
  it("uses the configured US Cloud project when no overrides are supplied", async () => {
    configure();
    vi.stubEnv("VITE_POSTHOG_KEY", undefined);
    vi.stubEnv("VITE_POSTHOG_HOST", undefined);
    const { initializePostHog } = await import("./posthog");
    await initializePostHog();
    expect(init).toHaveBeenCalledWith(
      "phc_yicKsESeQQ3k8GU4ADKuSg2CM2uhqzzLe672vEjcEoWh",
      expect.objectContaining({ api_host: "https://us.i.posthog.com" }),
    );
  });

  it("does nothing on the server", async () => {
    configure();
    vi.stubGlobal("window", undefined);
    const { initializePostHog } = await import("./posthog");
    await initializePostHog();
    expect(init).not.toHaveBeenCalled();
  });

  it("does nothing in development or without complete configuration", async () => {
    configure();
    const { initializePostHog } = await import("./posthog");
    vi.stubEnv("PROD", false);
    await initializePostHog();
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    await initializePostHog();
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "");
    await initializePostHog();
    expect(init).not.toHaveBeenCalled();
  });

  it("initializes once and removes sensitive URL values", async () => {
    configure();
    const { initializePostHog } = await import("./posthog");
    await Promise.all([initializePostHog(), initializePostHog()]);
    expect(init).toHaveBeenCalledTimes(1);
    const [key, options] = init.mock.calls[0];
    expect(key).toBe("phc_test");
    expect(options).toMatchObject({
      api_host: "https://eu.i.posthog.com",
      capture_pageview: "history_change",
      disable_session_recording: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    const event = { properties: { $current_url: "https://fishtankr.test/?code=secret#token" } };
    expect(options.before_send(event).properties.$current_url).toBe("https://fishtankr.test/");
    expect(options.before_send(null)).toBeNull();
  });

  it("does not propagate SDK failures into the app", async () => {
    configure();
    init.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    const { initializePostHog } = await import("./posthog");
    await expect(initializePostHog()).resolves.toBeUndefined();
    await initializePostHog();
    expect(init).toHaveBeenCalledTimes(2);
  });
});
