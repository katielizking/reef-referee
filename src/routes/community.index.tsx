import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CommunityLayout,
  PostCard,
  buttonClass,
  inputClass,
  useCommunityAccount,
  AccountGate,
} from "@/components/Community";
import { communityDb, FLAIRS, type Post } from "@/lib/community";
import { absoluteUrl } from "@/lib/site";
export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Aquarium community: questions, tanks & conversations | FishTankr" },
      {
        name: "description",
        content:
          "Share your aquarium, ask questions and exchange fishkeeping experiences in the FishTankr community.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/community") }],
  }),
  component: Feed,
});
function Feed() {
  const [sort, setSort] = useState("Hot");
  const [flair, setFlair] = useState("All flairs");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const account = useCommunityAccount();
  const posts = useQuery({
    queryKey: ["community", "feed", sort, flair, query, page, account.user?.id],
    queryFn: async () => {
      let q = communityDb
        .from("community_feed")
        .select("*,author:community_profiles(handle)")
        .eq("status", "visible");
      if (flair !== "All flairs") q = q.eq("flair", flair);
      if (query) q = q.ilike("title", `%${query.replace(/[\\%_]/g, "\\$&")}%`);
      if (sort === "Unanswered") q = q.eq("comment_count", 0);
      if (sort === "Saved") {
        if (!account.member) return [];
        const { data, error } = await communityDb
          .from("community_saves")
          .select("post_id")
          .eq("user_id", account.user!.id);
        if (error) throw error;
        if (!data.length) return [];
        q = q.in(
          "id",
          data.map((s) => s.post_id),
        );
      }
      q = q
        .order(sort === "Hot" ? "hot_rank" : sort === "Top" ? "score" : "created_at", {
          ascending: false,
        })
        .order("id", { ascending: false });
      const { data, error } = await q.range(page * 20, page * 20 + 20);
      if (error) throw error;
      return data as Post[];
    },
  });
  return (
    <CommunityLayout>
      <div className="mb-5 space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Feed order">
          {["Hot", "New", "Top", "Unanswered", "Saved"].map((s) => (
            <button
              key={s}
              aria-pressed={sort === s}
              onClick={() => {
                setSort(s);
                setPage(0);
              }}
              className={`rounded-full border px-4 py-2 text-sm ${sort === s ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            setPage(0);
          }}
        >
          <input
            aria-label="Search post titles"
            placeholder="Search conversations"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button className={buttonClass}>Search</button>
          <select
            aria-label="Filter by flair"
            value={flair}
            onChange={(e) => {
              setFlair(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border bg-background p-2 text-sm"
          >
            {["All flairs", ...FLAIRS].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </form>
      </div>
      {sort === "Saved" && !account.member ? (
        <AccountGate>
          <p>Your saved posts appear here.</p>
        </AccountGate>
      ) : posts.isPending ? (
        <p role="status">Loading conversations…</p>
      ) : posts.isError ? (
        <div role="alert" className="rounded-xl border p-5">
          Could not load conversations.{" "}
          <button className="underline" onClick={() => posts.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.data.slice(0, 20).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {!posts.data.length && (
              <div className="rounded-2xl border bg-card p-8">
                <h1 className="font-display text-2xl">
                  {query || flair !== "All flairs"
                    ? "No conversations found"
                    : sort === "Saved"
                      ? "Your saved shelf is empty"
                      : "Start the conversation"}
                </h1>
                <p className="mt-3 text-muted-foreground">
                  {query || flair !== "All flairs"
                    ? "Try another search or flair."
                    : sort === "Saved"
                      ? "Use Save on any post to find it here later."
                      : "A tank photo, a question you’ve been meaning to ask, or something you learned today. There’s room for all of it."}
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              disabled={page === 0}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-sm">Page {page + 1}</span>
            <button
              disabled={posts.data.length <= 20}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </CommunityLayout>
  );
}
