// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/** Fails the production build early if required Supabase env vars are not set. */
function validateSupabaseEnv(): Plugin {
  return {
    name: "validate-supabase-env",
    apply: "build",
    buildStart() {
      // Skip during test runs (vitest) where env vars are not expected
      if (process.env.VITEST || process.env.NODE_ENV === "test") return;
      const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `[build] Missing required environment variable(s): ${missing.join(", ")}. ` +
            `Set them in Lovable Cloud before deploying.`,
        );
      }
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [validateSupabaseEnv()],
  },
});
