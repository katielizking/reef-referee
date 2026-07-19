import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "list_blog_posts",
  title: "List FishTankr blog posts",
  description: "List published FishTankr blog posts with title, excerpt, tags, and slug. Use get_blog_post for full markdown.",
  inputSchema: {
    tag: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase
      .from("blog_posts")
      .select("slug, title, excerpt, tags, author_name, published_at, cover_image_url")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(input.limit ?? 20);
    if (input.tag) q = q.contains("tags", [input.tag]);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, posts: data ?? [] });
  },
});
