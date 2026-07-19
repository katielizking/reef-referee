import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data as BlogPost | null) ?? null;
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Post not found | FishTankr" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.post;
    const title = p.meta_title ?? `${p.title} | FishTankr`;
    const desc = p.meta_description ?? p.excerpt ?? "";
    const url = `/blog/${params.slug}`;
    const meta: Array<{ [key: string]: string }> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: p.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (p.cover_image_url) {
      meta.push({ property: "og:image", content: p.cover_image_url });
      meta.push({ property: "twitter:image", content: p.cover_image_url });
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
            author: { "@type": "Organization", name: p.author_name ?? "FishTankr" },
            datePublished: p.published_at,
            image: p.cover_image_url ?? undefined,
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Post not found</h1>
      <p className="mt-2 text-muted-foreground">
        <Link to="/blog" className="text-primary underline">Back to the blog</Link>
      </p>
    </main>
  ),
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/blog"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← All posts
      </Link>
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt=""
          className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.author_name && <span>{post.author_name}</span>}
          {post.published_at && (
            <time>
              {new Date(post.published_at).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      </header>
      <article className="prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body_markdown}</ReactMarkdown>
      </article>
    </main>
  );
}
