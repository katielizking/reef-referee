import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
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

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "FishTankr Blog — freshwater fishkeeping" },
      {
        name: "description",
        content:
          "Guides, reviews and evidence-led deep-dives on freshwater aquariums — welfare, stocking, filtration and habitat design.",
      },
      { property: "og:title", content: "FishTankr Blog" },
      {
        property: "og:description",
        content: "Guides and evidence-led reviews on freshwater aquariums.",
      },
      { property: "og:url", content: absoluteUrl("/blog") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/blog") }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, cover_image_url, author_name, tags, published_at",
        )
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogListItem[];
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Reading for a real setup?</strong>{" "}
          Put the species and water choices into the welfare screen as you go.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Open builder
        </Link>
      </div>
      <h1 className="font-display text-4xl font-bold text-foreground">Blog</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Practical, evidence-led writing on freshwater aquariums — welfare,
        stocking, filtration and habitat design for fishkeepers everywhere.
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
                  {new Date(post.published_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            {post.excerpt && (
              <p className="mt-2 text-sm text-muted-foreground">
                {post.excerpt}
              </p>
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
