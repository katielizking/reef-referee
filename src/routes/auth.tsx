import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/AccountPage";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { setup?: "password" } => ({
    setup: search.setup === "password" ? "password" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account | FishTankr" },
      { name: "description", content: "Create a FishTankr account or sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});
