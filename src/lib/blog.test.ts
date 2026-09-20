import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  formatShortDate,
  readingMinutes,
  relatedPosts,
  slugifyHeading,
  tagCounts,
  wordCount,
  type BlogSummary,
} from "./blog";

function post(slug: string, tags: string[], published_at: string): BlogSummary {
  return {
    id: slug,
    slug,
    title: slug,
    excerpt: null,
    cover_image_url: null,
    author_name: null,
    tags,
    published_at,
  };
}

describe("reading time", () => {
  it("never reports less than a minute", () => {
    expect(readingMinutes("Two words")).toBe(1);
  });

  it("scales with length", () => {
    const body = "word ".repeat(660);
    expect(readingMinutes(body)).toBe(3);
  });

  it("ignores markdown punctuation and links", () => {
    expect(wordCount("## Heading\n\n[link](https://example.com) text")).toBe(3);
  });
});

describe("headings", () => {
  it("picks up only the second level headings, in order", () => {
    const md = "# Title\n\n## First up\n\ntext\n\n### Deeper\n\n## Second up\n";
    expect(extractHeadings(md)).toEqual([
      { id: "first-up", text: "First up" },
      { id: "second-up", text: "Second up" },
    ]);
  });

  it("makes duplicate headings unique", () => {
    const md = "## Same\n## Same\n";
    expect(extractHeadings(md).map((h) => h.id)).toEqual(["same", "same-2"]);
  });

  it("strips punctuation from ids", () => {
    expect(slugifyHeading("Fed up with AqAdvisor?")).toBe("fed-up-with-aqadvisor");
  });
});

describe("related posts", () => {
  const all = [
    post("a", ["tools", "stocking"], "2026-09-01"),
    post("b", ["tools"], "2026-08-01"),
    post("c", ["plants"], "2026-07-01"),
  ];

  it("prefers the most shared tags and excludes itself", () => {
    const result = relatedPosts(all[0], all, 2).map((p) => p.slug);
    expect(result).toEqual(["b", "c"]);
  });

  it("returns nothing when there is only one post", () => {
    expect(relatedPosts(all[0], [all[0]])).toEqual([]);
  });
});

describe("tags and dates", () => {
  it("counts tags, most used first", () => {
    expect(tagCounts([post("a", ["tools"], ""), post("b", ["tools", "plants"], "")])).toEqual([
      { tag: "tools", count: 2 },
      { tag: "plants", count: 1 },
    ]);
  });

  it("formats a date in mono style", () => {
    expect(formatShortDate("2026-09-20T00:00:00Z")).toContain("2026");
  });

  it("handles a missing date", () => {
    expect(formatShortDate(null)).toBe("");
  });
});
