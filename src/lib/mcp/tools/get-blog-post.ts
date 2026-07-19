import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "get_blog_post",
  title: "Get a FishTankr blog post",
  description: "Return the full markdown body of a published FishTankr blog post by slug.",
  inputSchema: {
    slug: z.string().min(1),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = getAnonSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, body_markdown, tags, author_name, published_at, cover_image_url, meta_title, meta_description")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult(`No published post with slug '${slug}'.`);
    return textResult(data);
  },
});
