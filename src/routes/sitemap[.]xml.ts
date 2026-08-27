import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/quiz", changefreq: "monthly", priority: "0.8" },
          { path: "/guides", changefreq: "monthly", priority: "0.7" },
          { path: "/methodology", changefreq: "monthly", priority: "0.8" },
          { path: "/guides/cycling", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/shops", changefreq: "weekly", priority: "0.7" },
        ];

        const [posts, shops, species] = await Promise.all([
          supabase
            .from("blog_posts")
            .select("slug, published_at")
            .eq("published", true),
          supabase.from("aquarium_shops").select("slug"),
          supabase.from("species").select("id"),
        ]);

        (posts.data ?? []).forEach(
          (p: { slug: string; published_at: string | null }) => {
            entries.push({
              path: `/blog/${p.slug}`,
              changefreq: "monthly",
              priority: "0.6",
              lastmod: p.published_at ?? undefined,
            });
          },
        );
        (shops.data ?? []).forEach((s: { slug: string }) => {
          entries.push({
            path: `/shops/${s.slug}`,
            changefreq: "monthly",
            priority: "0.5",
          });
        });
        (species.data ?? []).forEach((s: { id: string }) => {
          entries.push({
            path: `/species/${s.id}`,
            changefreq: "monthly",
            priority: "0.5",
          });
        });

        const urls = entries
          .map((e) =>
            [
              "  <url>",
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
              e.changefreq
                ? `    <changefreq>${e.changefreq}</changefreq>`
                : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              "  </url>",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
