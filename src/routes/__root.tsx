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
import { Menu } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { WorkInProgressBanner } from "@/components/WorkInProgressBanner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl, SUPPORT_URL } from "@/lib/site";
import { initializePostHog } from "@/lib/posthog";
import { captureSentryError } from "@/lib/sentry";

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
    captureSentryError(error);
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
  "Plan a freshwater tank, check whether the fish suit each other and understand what they need to thrive.";

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
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:image", content: absoluteUrl("/favicon.png") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl("/favicon.png") },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Spectral:ital,wght@1,400;1,500&display=swap",
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
    void initializePostHog();
  }, []);

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
      <div className="site-shell flex min-h-screen flex-col bg-background/80">
        <SiteHeader />
        <WorkInProgressBanner />

        <div className="flex-1">
          <Outlet />
        </div>

        <SiteFooter />

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

const NAV_ITEMS: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/", label: "Builder", exact: true },
  { to: "/quiz", label: "Quiz" },
  { to: "/species", label: "Species" },
  { to: "/guides", label: "Guides" },
  { to: "/methodology", label: "How it works" },
  { to: "/shops", label: "Shops" },
  { to: "/blog", label: "Blog" },
  { to: "/saved", label: "My tanks" },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-foam/95 shadow-panel">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" aria-label="FishTankr home" className="rounded-lg">
          <BrandLogo />
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-ink/10 bg-surface-raised p-1 text-sm shadow-panel md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-foam hover:text-foreground"
              activeProps={{
                className: "rounded-full bg-ink px-3 py-2 font-semibold text-on-ink shadow-panel",
              }}
              activeOptions={item.exact ? { exact: true } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-ink/15 bg-surface-raised text-foreground shadow-panel md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex h-full w-[min(22rem,calc(100%-1.5rem))] flex-col gap-0 border-l border-ink/10 bg-background p-0"
          >
            <SheetHeader className="border-b border-ink/10 px-5 pb-5 pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] text-left">
              <SheetTitle className="font-display text-ui-heading">Navigate FishTankr</SheetTitle>
              <p className="text-ui-label text-muted-foreground">Plan a calmer, safer tank.</p>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-ui-label font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{
                    className:
                      "flex min-h-11 items-center rounded-xl bg-muted px-3 text-ui-label font-semibold text-foreground",
                  }}
                  activeOptions={item.exact ? { exact: true } : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-ink/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-ui-label font-semibold text-primary-foreground shadow-panel transition-colors hover:bg-primary/90"
              >
                Build your tank
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-ink/10 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size={22} showWordmark={false} />
            <span className="font-display font-semibold text-white">
              Smarter tanks. Happier fish.
            </span>
          </div>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/60">
            A guide, not a guarantee. Always check the needs of each species and the rules where you
            live.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
          <Link to="/species" className="transition-colors hover:text-white">
            Species
          </Link>
          <Link to="/guides" className="transition-colors hover:text-white">
            Guides
          </Link>
          <Link to="/methodology" className="transition-colors hover:text-white">
            Methodology
          </Link>
          <Link to="/blog" className="transition-colors hover:text-white">
            Blog
          </Link>
          <Link to="/shops" className="transition-colors hover:text-white">
            Shops
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-white">
            Terms
          </Link>
          <Link to="/welfare-disclaimer" className="transition-colors hover:text-white">
            Welfare disclaimer
          </Link>
          <Link to="/affiliate-disclosure" className="transition-colors hover:text-white">
            Affiliate disclosure
          </Link>
          <Link to="/attribution" className="transition-colors hover:text-white">
            3D credits
          </Link>
          <Link to="/contact" className="transition-colors hover:text-white">
            Contact
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-lime transition-colors hover:text-white"
          >
            Support FishTankr
          </a>
          <a href="/sitemap.xml" className="transition-colors hover:text-white">
            Sitemap
          </a>
        </nav>
      </div>
    </footer>
  );
}
