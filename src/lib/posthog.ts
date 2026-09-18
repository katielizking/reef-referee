let initialization: Promise<void> | undefined;

/** Browser-only, optional analytics. Never hold up rendering or anonymous sign-in. */
export function initializePostHog(): Promise<void> {
  if (typeof window === "undefined" || !import.meta.env.PROD) return Promise.resolve();

  // Public browser project token, not a secret/personal API key.
  // Explicit empty environment overrides disable analytics.
  const key = (
    import.meta.env.VITE_POSTHOG_KEY ?? "phc_yicKsESeQQ3k8GU4ADKuSg2CM2uhqzzLe672vEjcEoWh"
  ).trim();
  const host = (import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com").trim();
  if (!key || !host) return Promise.resolve();

  initialization ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        defaults: "2026-05-30",
        capture_pageview: "history_change",
        capture_pageleave: true,
        person_profiles: "never",
        autocapture: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
        disable_session_recording: true,
        respect_dnt: true,
        before_send: (event) => {
          // Auth callbacks and shared links can contain sensitive query/hash values.
          if (event?.properties) {
            for (const property of [
              "$current_url",
              "$referrer",
              "$initial_current_url",
              "$initial_referrer",
            ]) {
              const value = event.properties[property];
              if (typeof value !== "string" || !value) continue;
              try {
                const url = new URL(value);
                event.properties[property] = url.origin + url.pathname;
              } catch {
                delete event.properties[property];
              }
            }
          }
          return event;
        },
      });
    })
    .catch(() => {
      // Analytics failures must not prevent people from using the planner.
      initialization = undefined;
    });

  return initialization;
}
