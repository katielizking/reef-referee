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
import { TankDraftProvider } from "@/components/TankDraftProvider";
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
          This page has swum off
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page may have moved. Head back to your tank plan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            Back to my tank
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
          Try again, or head back to your tank plan.
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
            Back to my tank
          </a>
        </div>
      </div>
    </div>
  );
}

const TITLE = "FishTankr | Smarter tanks. Happier fish.";
const DESC =
  "Plan a freshwater tank, check whether the fish suit each other and understand what they need to thrive.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "jPSg_1jpCEpOJfh9XNRo7MiLf-mR8TPcI28PxQLJBW8" },
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "theme-color", content: "#0B1530" },
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
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap",
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
    <html lang="en-AU">
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
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <div className="site-shell flex min-h-screen flex-col bg-background/80">
        <SiteHeader />


        <div className="flex-1">
          <TankDraftProvider><Outlet /></TankDraftProvider>
        </div>

        <SiteFooter />

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

const NAV_ITEMS: Array<{ to: string; label: string; exact?: boolean; hash?: string }> = [
  { to: "/calculator", label: "Calculator" },
  { to: "/visualiser", label: "Visualiser" },
  { to: "/species", label: "Fish library" },
  { to: "/saved", label: "My tanks" },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(24px,5.8vw,88px)] flex min-h-16 items-center justify-between gap-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" aria-label="FishTankr home" className="rounded-lg">
          <BrandLogo size={30} />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              hash={item.hash}
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-foreground underline decoration-blue decoration-1 underline-offset-8",
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
              className="inline-flex size-11 items-center justify-center rounded-md border border-foreground/20 bg-transparent text-foreground md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex h-full w-[min(22rem,calc(100%-1.5rem))] flex-col gap-0 border-l border-foreground/10 bg-background p-0"
          >
            <SheetHeader className="border-b border-foreground/10 px-5 pb-5 pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] text-left">
              <SheetTitle className="font-display text-ui-heading">FishTankr</SheetTitle>
              <p className="text-ui-label text-muted-foreground">
                Plan a tank that suits your fish.
              </p>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
              hash={item.hash}
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
            <div className="border-t border-foreground/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <Link
                to="/calculator"
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
    <footer className="relative mt-20 overflow-hidden border-t border-foreground/10 bg-ink text-white">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(24px,5.8vw,88px)] grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size={22} />
            <span className="font-display text-base text-white">Smarter tanks. Happier fish.</span>
          </div>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/60">
            Check each species’ needs and the local rules before you stock.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
          <Link to="/quiz">Fish quiz</Link><Link to="/guides">Guides</Link><Link to="/shops">Shops</Link><Link to="/blog">Blog</Link>
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
            className="font-semibold text-blue transition-colors hover:text-white"
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
