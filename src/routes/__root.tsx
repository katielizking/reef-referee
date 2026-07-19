import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Nothing swimming here
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're after may have moved. Let's get you back to your tank.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            Back to the builder
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Something's not quite right
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Give it another go, or head back to the builder.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Back to the builder
          </a>
        </div>
      </div>
    </div>
  );
}

const TITLE = "FishTankr — Smarter tanks. Happier fish.";
const DESC =
  "Simple tools that make fishkeeping easier to understand and better for the animals in our care. Plan a setup, check your stocking and see the biology behind a healthy aquarium.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "theme-color", content: "#37B8C6" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "FishTankr" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link to="/" aria-label="FishTankr home" className="rounded-lg">
              <BrandLogo />
            </Link>
            <nav aria-label="Primary" className="flex flex-wrap items-center gap-0.5 text-sm">
              {[
                { to: "/", label: "Builder", exact: true },
                { to: "/quiz", label: "Quiz" },
                { to: "/guides", label: "Guides" },
                { to: "/shops", label: "Shops" },
                { to: "/blog", label: "Blog" },
                { to: "/saved", label: "My tanks" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{
                    className:
                      "rounded-lg px-2.5 py-1.5 font-medium bg-muted text-foreground",
                  }}
                  activeOptions={item.exact ? { exact: true } : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="flex-1">
          <Outlet />
        </div>

        <footer className="mt-16 border-t border-border/70 bg-card/50">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo size={22} showWordmark={false} />
              <span className="font-display font-semibold text-foreground">
                Smarter tanks. Happier fish.
              </span>
            </div>
            <p className="max-w-md text-xs sm:text-right">
              This is a guide, not a guarantee. Always check the needs of each species
              and follow the rules in your state.
            </p>
          </div>
        </footer>

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
