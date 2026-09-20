import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CommunityLayout,
  AccountGate,
  useCommunityAccount,
  buttonClass,
} from "@/components/Community";
import { communityDb, communityWrite, communityPhotoUrl } from "@/lib/community";
export const Route = createFileRoute("/community/moderation")({
  head: () => ({
    meta: [{ title: "Moderation | FishTankr" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <CommunityLayout>
      <AccountGate>
        <Queue />
      </AccountGate>
    </CommunityLayout>
  ),
});
function Queue() {
  const a = useCommunityAccount();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const reports = useQuery({
    queryKey: ["community", "reports", a.user?.id],
    enabled: a.moderator.data === true,
    queryFn: async () => {
      const { data, error } = await communityDb
        .from("community_reports")
        .select(
          "*,post:community_posts(title,body,status,locked,link_url),comment:community_comments(body)",
        )
        .eq("resolved", false)
        .order("created_at")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  if (a.moderator.isPending) return <p>Checking moderator access…</p>;
  if (!a.moderator.data) return <p>Moderator access is required.</p>;
  async function act(
    action: string,
    r: { post_id: string; id: string; comment_id: string | null },
  ) {
    setBusy(true);
    try {
      await communityWrite(action, {
        post_id: r.post_id,
        report_id: r.id,
        comment_id: r.comment_id,
      });
      if (action === "hide" && !r.comment_id) {
        const row = reports.data?.find((item) => item.id === r.id);
        const photo = communityPhotoUrl(row?.post?.link_url ?? "");
        if (photo) {
          const marker = "/community-photos/";
          const path = photo.split(marker)[1];
          if (path) {
            const { error } = await communityDb.storage.from("community-photos").remove([path]);
            if (error)
              throw new Error(
                "Post hidden, but photo removal failed. Keep this report open and retry Hide.",
              );
          }
        }
      }
      await qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("Moderation action saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1 className="font-display text-3xl">Moderation queue</h1>
      <p className="my-4 text-sm text-muted-foreground">
        Oldest unresolved reports first (up to 100). Review the context, act if needed, then
        resolve. Hiding a comment replaces its text; hiding a post can be reversed.
      </p>
      {reports.isPending ? (
        <p>Loading reports…</p>
      ) : reports.isError ? (
        <p role="alert">
          Could not load reports.{" "}
          <button className="underline" onClick={() => reports.refetch()}>
            Retry
          </button>
        </p>
      ) : reports.data.length === 0 ? (
        <p>No unresolved reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.data.map((r) => (
            <article key={r.id} className="rounded-xl border p-5">
              <Link
                to="/community/$id"
                params={{ id: r.post_id }}
                className="font-semibold underline"
              >
                {r.post?.title ?? "Post unavailable"}
              </Link>
              <p className="mt-3 whitespace-pre-wrap break-words">
                {r.comment?.body ?? r.post?.body}
              </p>
              <p className="my-3 text-sm">
                <strong>Report:</strong> {r.reason}
              </p>
              {communityPhotoUrl(r.post?.link_url ?? "") && (
                <img
                  src={r.post.link_url}
                  alt="Reported photo"
                  className="my-3 max-h-64 rounded-lg"
                />
              )}
              <p className="mb-3 text-xs">
                Status: {r.post?.status} · {r.post?.locked ? "Locked" : "Open"}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "hide",
                  ...(r.comment_id ? [] : ["restore", r.post?.locked ? "unlock" : "lock"]),
                  "ban",
                  "resolve",
                ].map((action) => (
                  <button
                    key={action}
                    disabled={busy}
                    className={buttonClass}
                    onClick={() => {
                      if (
                        (action === "ban" || action === "hide") &&
                        !window.confirm(
                          `${action === "ban" ? "Ban this content’s author from participating" : "Hide this content"}?`,
                        )
                      )
                        return;
                      void act(action, r);
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
