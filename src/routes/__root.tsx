import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Menu, UserRound } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TankDraftProvider } from "@/components/TankDraftProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl, SUPPORT_URL } from "@/lib/site";
import { initializePostHog } from "@/lib/posthog";
import { captureSentryError } from "@/lib/sentry";
import { AccountProvider, useAccount, useSignOut } from "@/lib/account";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
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
            to="/calculator"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            Back to my tank
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    captureSentryError(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
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
            href="/calculator"
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var home=location.pathname==='/';var saved=localStorage.getItem('fishtankr:theme');var theme=home?'dark':(saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));document.documentElement.classList.add(theme);document.documentElement.style.colorScheme=theme}catch(e){document.documentElement.classList.add('dark')}})();`,
          }}
        />
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

  useEffect(() => {
    void initializePostHog();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
    })().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <div className="site-shell flex min-h-dvh flex-col bg-background/80">
          <SiteHeader />

          <div className="flex-1">
            <TankDraftProvider>
              <Outlet />
            </TankDraftProvider>
          </div>

          <SiteFooter />

          <Toaster />
        </div>
      </AccountProvider>
    </QueryClientProvider>
  );
}

const NAV_ITEMS: Array<{ to: string; label: string; exact?: boolean; hash?: string }> = [
  { to: "/calculator", label: "Calculator" },
  { to: "/visualiser", label: "Visualiser" },
  { to: "/species", label: "Fish library" },
  { to: "/tracker", label: "Tracker" },
  { to: "/tank-ideas", label: "Tank Ideas" },
  { to: "/community", label: "Community" },
  { to: "/saved", label: "My tanks" },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const showThemeToggle = location.pathname !== "/";

  useEffect(() => {
    if (location.pathname !== "/") return;
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0B1530");
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(24px,5.8vw,88px)] flex min-h-16 items-center justify-between gap-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" aria-label="FishTankr home" className="rounded-lg">
          <BrandLogo size={30} />
        </Link>
        <div className="hidden items-center gap-2 xl:flex">
          <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
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
          <AccountMenu />
          {showThemeToggle && <ThemeToggle />}
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          {showThemeToggle && <ThemeToggle />}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md border border-foreground/20 bg-transparent text-foreground"
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
                <MobileAccountLinks close={() => setOpen(false)} />
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
      </div>
    </header>
  );
}

function AccountMenu() {
  const account = useAccount();
  const signOut = useSignOut();
  if (!account.ready) return <span className="size-9" aria-hidden />;
  if (!account.isSignedIn)
    return (
      <Link
        to="/auth"
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Sign in
      </Link>
    );
  const label = account.handle ?? account.user?.email ?? "Account";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex max-w-48 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold">
        <UserRound className="size-4" aria-hidden />
        <span className="truncate">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/saved">My tanks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/tracker">Tracker</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/community">Community</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccountLinks({ close }: { close: () => void }) {
  const account = useAccount();
  const signOut = useSignOut();
  if (!account.isSignedIn)
    return (
      <Link
        to="/auth"
        onClick={close}
        className="mb-3 flex min-h-11 items-center justify-center rounded-xl border font-semibold"
      >
        Sign in
      </Link>
    );
  return (
    <div className="mb-3">
      <p className="truncate px-1 pb-2 text-xs text-muted-foreground">
        Signed in as {account.handle ?? account.user?.email}
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border font-semibold"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </div>
  );
}

const footerLinkClass = "text-sm text-on-ink-muted transition-colors hover:text-on-ink";

const footerGroups: Array<{
  heading: string;
  links: Array<{ to?: string; href?: string; label: string }>;
}> = [
  {
    heading: "Plan",
    links: [
      { to: "/calculator", label: "Calculator" },
      { to: "/visualiser", label: "3D planner" },
      { to: "/species", label: "Species library" },
      { to: "/tracker", label: "Tank tracker" },
      { to: "/tank-ideas", label: "Tank Ideas" },
      { to: "/community", label: "Community" },
      { to: "/quiz", label: "Fish quiz" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { to: "/guides", label: "Guides" },
      { to: "/blog", label: "Blog" },
      { to: "/methodology", label: "Methodology" },
      { to: "/shops", label: "Shops" },
    ],
  },
  {
    heading: "About",
    links: [
      { to: "/contact", label: "Contact" },
      { to: "/attribution", label: "3D credits" },
      { href: SUPPORT_URL, label: "Support FishTankr" },
      { href: "/sitemap.xml", label: "Sitemap" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-foreground/10 bg-ink text-on-ink">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(24px,5.8vw,88px)] pb-8 pt-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <BrandLogo size={22} />
              <span className="font-display text-base">Smarter tanks. Happier fish.</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-on-ink-muted">
              Check each species’ needs and the local rules before you stock.
            </p>
          </div>
          {footerGroups.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h3 className="text-ui-label font-semibold uppercase tracking-wide text-on-ink-muted">
                {group.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className={footerLinkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.href!.startsWith("http") ? "_blank" : undefined}
                        rel={link.href!.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={footerLinkClass}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-on-ink/15 pt-6 text-xs text-on-ink-muted">
          <span>© 2026 FishTankr</span>
          <Link to="/privacy" className="transition-colors hover:text-on-ink">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-on-ink">
            Terms
          </Link>
          <Link to="/welfare-disclaimer" className="transition-colors hover:text-on-ink">
            Welfare disclaimer
          </Link>
          <Link to="/affiliate-disclosure" className="transition-colors hover:text-on-ink">
            Affiliate disclosure
          </Link>
        </div>
      </div>
    </footer>
  );
}
