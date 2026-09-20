/**
 * Small helpers for the blog: reading time, headings for the contents list,
 * and picking related posts by shared tags. Pure functions so they can be
 * tested without a database.
 */

export type BlogSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  published_at: string | null;
};

const WORDS_PER_MINUTE = 220;

export function wordCount(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|[\]()-]/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  const words = plain.split(/\s+/).filter(Boolean);
  return words.length;
}

/** Minutes, rounded up, never below one. */
export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(wordCount(markdown) / WORDS_PER_MINUTE));
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export type Heading = { id: string; text: string };

/** Top level sections only: the ## headings, in document order. */
export function extractHeadings(markdown: string): Heading[] {
  const seen = new Map<string, number>();
  const out: Heading[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[1].replace(/[*_`]/g, "").trim();
    const base = slugifyHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    out.push({ id: count === 0 ? base : `${base}-${count + 1}`, text });
  }
  return out;
}

/** Other posts sharing the most tags, newest first as the tiebreaker. */
export function relatedPosts<T extends BlogSummary>(current: T, all: T[], limit = 3): T[] {
  const tags = new Set(current.tags ?? []);
  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({ p, shared: (p.tags ?? []).filter((t) => tags.has(t)).length }))
    .sort((a, b) => {
      if (b.shared !== a.shared) return b.shared - a.shared;
      return (b.p.published_at ?? "").localeCompare(a.p.published_at ?? "");
    })
    .slice(0, limit)
    .map((row) => row.p);
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

/** Every tag in use, most used first. */
export function tagCounts(posts: BlogSummary[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
