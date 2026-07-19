import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  published_at: string | null;
};

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "FishTankr Blog — freshwater fishkeeping in Australia" },
      {
        name: "description",
        content:
          "Guides, reviews and deep-dives on freshwater aquariums for Australian keepers — stocking, filtration, legality and biotope tanks.",
      },
      { property: "og:title", content: "FishTankr Blog" },
      {
        property: "og:description",
        content:
          "Guides and reviews on freshwater aquariums for Australian keepers.",
      },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, author_name, tags, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogListItem[];
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">Blog</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Practical writing on freshwater aquariums — stocking, filtration, legality and
        biotope tanks, with a distinct Australian slant.
      </p>

      <div className="mt-8 grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data?.map((post) => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group block rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h2>
              {post.published_at && (
                <time className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            {post.excerpt && (
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            )}
            {post.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
