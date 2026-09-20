import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import {
  extractHeadings,
  formatPostDate,
  formatShortDate,
  readingMinutes,
  relatedPosts,
  wordCount,
  type BlogSummary,
} from "@/lib/blog";

type BlogPost = BlogSummary & {
  body_markdown: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string | null;
};

const LIST_COLUMNS =
  "id, slug, title, excerpt, cover_image_url, author_name, tags, published_at" as const;

async function fetchPost(slug: string) {
  const [{ data, error }, list] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
    supabase
      .from("blog_posts")
      .select(LIST_COLUMNS)
      .eq("published", true)
      .order("published_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (list.error) throw list.error;
  return {
    post: (data as BlogPost | null) ?? null,
    all: (list.data ?? []) as BlogSummary[],
  };
}

function shareImage(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : absoluteUrl(url);
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { post, all } = await fetchPost(params.slug);
    if (!post) throw notFound();
    return { post, all };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Note not found | FishTankr" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.post;
    const title = p.meta_title ?? `${p.title} | FishTankr`;
    const desc = p.meta_description ?? p.excerpt ?? "";
    const url = absoluteUrl(`/blog/${params.slug}`);
    const image = shareImage(p.cover_image_url);
    const meta: Array<{ [key: string]: string }> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: p.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: p.title,
            description: desc,
            url,
            mainEntityOfPage: url,
            articleSection: p.tags?.[0] ?? "Aquarium planning",
            wordCount: wordCount(p.body_markdown),
            datePublished: p.published_at,
            dateModified: p.updated_at ?? p.published_at,
            author: { "@type": "Organization", name: p.author_name ?? "FishTankr" },
            publisher: {
              "@type": "Organization",
              name: "FishTankr",
              url: absoluteUrl("/"),
            },
            image: image ?? undefined,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Field notes", item: absoluteUrl("/blog") },
              { "@type": "ListItem", position: 3, name: p.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">That note is not here</h1>
      <p className="mt-2 text-muted-foreground">
        <Link to="/blog" className="text-primary underline">
          Back to the field notes
        </Link>
      </p>
    </main>
  ),
});

/** Hairline progress bar across the top of the window. */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-px bg-transparent" aria-hidden>
      <div
        className="h-px bg-primary transition-[width] duration-150"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BlogPostPage() {
  const { post, all } = Route.useLoaderData();
  const headings = extractHeadings(post.body_markdown);
  const minutes = readingMinutes(post.body_markdown);
  const related = relatedPosts(post, all, 3);
  const index = all.findIndex((p) => p.slug === post.slug);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const shareUrl = absoluteUrl(`/blog/${post.slug}`);

  return (
    <>
      <ReadingProgress />
      <main className="pb-16">
        {post.cover_image_url && (
          <div className="border-b border-border">
            <img
              src={post.cover_image_url}
              alt=""
              width={1200}
              height={630}
              className="aspect-[1200/630] w-full object-cover"
            />
          </div>
        )}

        <div className="mx-auto max-w-5xl px-4">
          <nav className="pt-8">
            <Link to="/blog" className="data-mono text-xs text-muted-foreground hover:text-primary">
              ← Field notes
            </Link>
          </nav>

          <header className="mt-6 border-b border-foreground/25 pb-8">
            {post.tags?.length > 0 && (
              <p className="science-label text-primary">{post.tags.join(" · ")}</p>
            )}
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-[-.04em] text-foreground sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{post.excerpt}</p>
            )}
            <p className="data-mono mt-6 text-xs text-muted-foreground">
              {post.author_name ?? "FishTankr"} · {formatShortDate(post.published_at)} · {minutes}{" "}
              min read
            </p>
          </header>

          <div className="mt-10 gap-12 lg:grid lg:grid-cols-[1fr_15rem] lg:items-start">
            <article className="max-w-[68ch]">
              <MarkdownArticle body={post.body_markdown} />

              <footer className="mt-14 border-t border-foreground/25 pt-6">
                <p className="data-mono text-xs text-muted-foreground">
                  Published {formatPostDate(post.published_at)}
                  {post.updated_at &&
                  post.updated_at.slice(0, 10) !== post.published_at?.slice(0, 10)
                    ? ` · updated ${formatPostDate(post.updated_at)}`
                    : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <a
                    className="data-mono text-xs text-primary hover:underline"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Share on Facebook
                  </a>
                  <a
                    className="data-mono text-xs text-primary hover:underline"
                    href={`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Share on Reddit
                  </a>
                  <a
                    className="data-mono text-xs text-primary hover:underline"
                    href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareUrl)}`}
                  >
                    Send by email
                  </a>
                </div>
              </footer>

              {(newer || older) && (
                <nav className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                  {older && (
                    <Link
                      to="/blog/$slug"
                      params={{ slug: older.slug }}
                      className="group border border-border p-4 hover:border-primary/50"
                    >
                      <p className="data-mono text-xs text-muted-foreground">Previous note</p>
                      <p className="mt-1 font-display font-bold text-foreground group-hover:text-primary">
                        {older.title}
                      </p>
                    </Link>
                  )}
                  {newer && (
                    <Link
                      to="/blog/$slug"
                      params={{ slug: newer.slug }}
                      className="group border border-border p-4 text-right hover:border-primary/50 sm:col-start-2"
                    >
                      <p className="data-mono text-xs text-muted-foreground">Next note</p>
                      <p className="mt-1 font-display font-bold text-foreground group-hover:text-primary">
                        {newer.title}
                      </p>
                    </Link>
                  )}
                </nav>
              )}

              {related.length > 0 && (
                <section className="mt-12 border-t border-foreground/25 pt-6">
                  <h2 className="science-label text-foreground/60">Related notes</h2>
                  <ul className="mt-3 divide-y divide-border">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug: r.slug }}
                          className="group flex items-baseline justify-between gap-4 py-3"
                        >
                          <span className="font-display text-foreground group-hover:text-primary">
                            {r.title}
                          </span>
                          <span className="data-mono shrink-0 text-xs text-muted-foreground">
                            {formatShortDate(r.published_at)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <aside className="mt-12 lg:sticky lg:top-24 lg:mt-0">
              {headings.length > 1 && (
                <nav aria-label="In this note" className="border-t border-foreground/25 pt-4">
                  <p className="science-label text-foreground/60">In this note</p>
                  <ul className="mt-3 space-y-2">
                    {headings.map((h) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="mt-8 border border-border p-4">
                <p className="science-label text-foreground/60">Try it on your tank</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your tank size and the fish you are considering, and see what needs fixing
                  first.
                </p>
                <Link
                  to="/calculator"
                  className="mt-3 inline-flex min-h-11 items-center border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Open the planner
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
