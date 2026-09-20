import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
// This additive schema is maintained in 20260920001000_community.sql.
export const communityDb = supabase as unknown as SupabaseClient;
export const FLAIRS = [
  "General",
  "Question",
  "Show & tell",
  "Progress",
  "Discussion",
  "Equipment",
  "Plants",
  "Inspiration",
];
export interface Post {
  id: string;
  author_id: string;
  title: string;
  body: string;
  link_url: string | null;
  flair: string;
  score: number;
  comment_count: number;
  created_at: string;
  edited_at: string | null;
  locked: boolean;
  status: string;
  author: { handle: string } | null;
}
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  status: string;
  author: { handle: string } | null;
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function safeLink(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}
export async function communityWrite(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await communityDb.rpc("community_write", { action, payload });
  if (error) throw new Error(error.message);
  return data as string;
}
export async function getPost(id: string) {
  if (!UUID.test(id)) return null;
  const { data, error } = await communityDb
    .from("community_posts")
    .select("*,author:community_profiles(handle)")
    .eq("id", id)
    .eq("status", "visible")
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
}
export async function getComments(id: string) {
  const { data, error } = await communityDb
    .from("community_comments")
    .select("*,author:community_profiles(handle)")
    .eq("post_id", id)
    .order("created_at")
    .limit(1000);
  if (error) throw error;
  return data as Comment[];
}

export function communityPhotoUrl(value: string): string | null {
  const base = supabase.storage.from("community-photos").getPublicUrl("").data.publicUrl;
  return value.startsWith(base) && /^https:\/\//.test(value) && /\.(jpg|png|webp)$/.test(value)
    ? value
    : null;
}
