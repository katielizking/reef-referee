import * as Sentry from "@sentry/react";

let initialized = false;

/** Browser monitoring; the DSN is a public ingestion address, not an API token. */
export function initializeSentry() {
  if (initialized || typeof window === "undefined" || !import.meta.env.PROD) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment: "production",
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.breadcrumbsIntegration({ console: false, dom: false }),
      ],
      tracesSampleRate: 0.1,
      tracePropagationTargets: [],
      beforeSend(event) {
        delete event.user;
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
          delete event.request.data;
          delete event.request.query_string;
          if (event.request.url) {
            try {
              const url = new URL(event.request.url);
              event.request.url = url.origin + url.pathname;
            } catch {
              delete event.request.url;
            }
          }
        }
        return event;
      },
    });
    initialized = true;
  } catch {
    // Monitoring must never prevent the app from starting.
  }
}

export function captureSentryError(error: unknown) {
  initializeSentry();
  if (initialized) Sentry.captureException(error);
}
