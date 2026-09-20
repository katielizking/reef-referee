import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPostDate, formatShortDate, tagCounts, type BlogSummary } from "@/lib/blog";

const LIST_COLUMNS =
  "id, slug, title, excerpt, cover_image_url, author_name, tags, published_at" as const;

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Field notes | FishTankr" },
      {
        name: "description",
        content:
          "Sourced writing on freshwater stocking, fish welfare, filtration and the tools aquarists use to plan a tank.",
      },
      { property: "og:title", content: "Field notes | FishTankr" },
      {
        property: "og:description",
        content: "Sourced writing on freshwater stocking, fish welfare and aquarium planning tools.",
      },
      { property: "og:type", content: "website" },
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
        .select(LIST_COLUMNS)
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogSummary[];
    },
  });

  const [tag, setTag] = useState<string | null>(null);
  const posts = data ?? [];
  const tags = useMemo(() => tagCounts(posts), [posts]);
  const filtered = tag ? posts.filter((p) => p.tags?.includes(tag)) : posts;
  const [lead, ...rest] = filtered;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="border-b border-foreground/25 pb-6">
        <p className="science-label text-primary">Field notes</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-foreground sm:text-5xl">
          Writing from the tank side
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Stocking, filtration, water and the tools people plan with. Sourced, checked, and written
          for the fish rather than the algorithm.
        </p>
        <p className="data-mono mt-4 text-xs text-muted-foreground">
          {posts.length} {posts.length === 1 ? "note" : "notes"}
          {posts[0]?.published_at ? ` · latest ${formatShortDate(posts[0].published_at)}` : ""}
        </p>
      </header>

      {tags.length > 1 && (
        <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Filter by topic">
          <TagChip label="All" active={tag === null} onClick={() => setTag(null)} />
          {tags.map(({ tag: t, count }) => (
            <TagChip
              key={t}
              label={`${t} (${count})`}
              active={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
            />
          ))}
        </nav>
      )}

      {isLoading && <p className="data-mono mt-10 text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing filed under that topic yet. New notes go up as the research lands.
        </p>
      )}

      {lead && (
        <Link
          to="/blog/$slug"
          params={{ slug: lead.slug }}
          className="group mt-10 block"
          aria-label={lead.title}
        >
          {lead.cover_image_url && (
            <div className="overflow-hidden border border-border">
              <img
                src={lead.cover_image_url}
                alt=""
                className="aspect-[1200/630] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.02]"
              />
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-[8rem_1fr]">
            <p className="data-mono text-xs text-muted-foreground">
              {formatShortDate(lead.published_at)}
            </p>
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-.03em] text-foreground group-hover:text-primary sm:text-4xl">
                {lead.title}
              </h2>
              {lead.excerpt && (
                <p className="mt-3 max-w-2xl text-muted-foreground">{lead.excerpt}</p>
              )}
              <p className="data-mono mt-4 text-xs text-primary">Read the note →</p>
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="mt-14 border-t border-border">
          {rest.map((post) => (
            <li key={post.id} className="border-b border-border">
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"
              >
                <p className="data-mono text-xs text-muted-foreground">
                  {formatShortDate(post.published_at)}
                </p>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <aside className="mt-16 border-t border-foreground/25 pt-6 sm:flex sm:items-end sm:justify-between">
        <div>
          <p className="science-label text-foreground/60">While you are here</p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Put your tank size and the fish you want into the planner and see what needs changing
            before you buy.
          </p>
        </div>
        <Link
          to="/calculator"
          className="mt-4 inline-flex min-h-11 items-center justify-center border border-primary px-5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground sm:mt-0"
        >
          Open the planner
        </Link>
      </aside>

      {posts.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "FishTankr field notes",
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/blog/${p.slug}`),
                name: p.title,
              })),
            }),
          }}
        />
      )}
      <p className="sr-only">{posts[0] ? formatPostDate(posts[0].published_at) : ""}</p>
    </main>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`data-mono border px-3 py-1.5 text-xs uppercase tracking-[0.1em] ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
