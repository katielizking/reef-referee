import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const COMMUNITY_FLAIRS = ["Question", "Help", "Tank check", "Water parameters", "Show my tank", "Stocking ideas", "Species talk", "Gear", "Shops", "Tank ideas", "Beginner", "Build journal", "Discussion"] as const;
export type CommunityFlair = (typeof COMMUNITY_FLAIRS)[number];
export interface CommunityPost { id: string; slug: string; title: string; body: string; flair: CommunityFlair; author_handle: string; score: number; comment_count: number; created_at: string; }
export interface CommunityComment { id: string; post_id: string; body: string; author_handle: string; score: number; created_at: string; }
const db = () => supabase.from as any;

export function useCommunityPosts() {
  return useQuery({ queryKey: ["community-posts"], queryFn: async () => { const { data, error } = await db()("community_posts").select("*").eq("status", "published").order("score", { ascending: false }).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as CommunityPost[]; }, staleTime: 30_000 });
}
export function useCommunityPost(slug: string) {
  return useQuery({ queryKey: ["community-post", slug], enabled: Boolean(slug), queryFn: async () => { const { data, error } = await db()("community_posts").select("*").eq("slug", slug).eq("status", "published").single(); if (error) throw error; return data as CommunityPost; } });
}
export function useCommunityComments(postId?: string) {
  return useQuery({ queryKey: ["community-comments", postId], enabled: Boolean(postId), queryFn: async () => { const { data, error } = await db()("community_comments").select("*").eq("post_id", postId).eq("status", "published").order("score", { ascending: false }).order("created_at"); if (error) throw error; return (data ?? []) as CommunityComment[]; } });
}
export async function ensureCommunityUser() { const { data } = await supabase.auth.getUser(); if (!data.user) throw new Error("Starting your session failed. Please refresh and try again."); return data.user; }
export async function createCommunityPost(input: { title: string; body: string; flair: CommunityFlair }) { const user = await ensureCommunityUser(); const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 62)}-${crypto.randomUUID().slice(0, 8)}`; const handle = `fishkeeper-${user.id.slice(0, 5)}`; const { data, error } = await db()("community_posts").insert({ user_id: user.id, slug, title: input.title.trim(), body: input.body.trim(), flair: input.flair, author_handle: handle }).select("*").single(); if (error) throw error; return data as CommunityPost; }
export async function createCommunityComment(postId: string, body: string) { const user = await ensureCommunityUser(); const { error } = await db()("community_comments").insert({ post_id: postId, user_id: user.id, author_handle: `fishkeeper-${user.id.slice(0, 5)}`, body: body.trim() }); if (error) throw error; }
