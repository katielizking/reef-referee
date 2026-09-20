import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CommunityLayout,
  PostActions,
  PostPhoto,
  PostComposer,
  AccountGate,
  buttonClass,
  inputClass,
  useCommunityAccount,
} from "@/components/Community";
import { getPost, getComments, communityWrite, safeLink, type Comment } from "@/lib/community";
import { absoluteUrl } from "@/lib/site";
export const Route = createFileRoute("/community/$id")({
  loader: async ({ params }) => {
    const post = await getPost(params.id);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData: p }) =>
    p
      ? {
          meta: [
            { title: `${p.title} | FishTankr community` },
            {
              name: "description",
              content: p.body.slice(0, 155) || "Join this fishkeeping conversation.",
            },
            { name: "robots", content: "noindex,follow" },
          ],
          links: [{ rel: "canonical", href: absoluteUrl(`/community/${p.id}`) }],
        }
      : {},
  component: Thread,
});
function Thread() {
  const initial = Route.useLoaderData();
  const qc = useQueryClient();
  const account = useCommunityAccount();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [order, setOrder] = useState("Oldest");
  const post = useQuery({
    queryKey: ["community", "post", initial.id],
    queryFn: () => getPost(initial.id),
    initialData: initial,
  });
  const comments = useQuery({
    queryKey: ["community", "comments", initial.id],
    queryFn: () => getComments(initial.id),
  });
  if (post.isError)
    return (
      <CommunityLayout>
        <p role="alert">
          Could not refresh this discussion.{" "}
          <button onClick={() => post.refetch()} className="underline">
            Retry
          </button>
        </p>
      </CommunityLayout>
    );
  if (!post.data)
    return (
      <CommunityLayout>
        <p>This post is no longer available.</p>
        <Link to="/community">Back to the feed</Link>
      </CommunityLayout>
    );
  const p = post.data;
  return (
    <CommunityLayout>
      <Link to="/community" className="text-sm text-primary">
        ← Back to conversations
      </Link>
      {editing ? (
        <div className="mt-5">
          <PostComposer post={p} onDone={() => setEditing(false)} />
          <button className="mt-3 underline" onClick={() => setEditing(false)}>
            Cancel editing
          </button>
        </div>
      ) : (
        <article className="mt-5 rounded-2xl border bg-card p-6">
          <p className="text-xs text-muted-foreground">
            u/{p.author?.handle ?? "member"} · {p.flair} ·{" "}
            {new Date(p.created_at).toLocaleDateString("en-AU", { timeZone: "UTC" })}
            {p.edited_at ? " · edited" : ""}
          </p>
          <h1 className="mt-3 font-display text-3xl break-words">{p.title}</h1>
          <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">{p.body}</p>
          {p.link_url && safeLink(p.link_url) && (
            <a
              className="mt-5 block break-all text-primary underline"
              href={safeLink(p.link_url)!}
              target="_blank"
              rel="ugc nofollow noopener noreferrer"
            >
              {p.link_url} ↗
            </a>
          )}
          <PostPhoto post={p} />
          <PostActions post={p} />
          {account.user?.id === p.author_id && (
            <div className="mt-4 flex gap-4 text-sm">
              <button
                disabled={p.locked}
                className="underline disabled:opacity-50"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button className="underline" onClick={() => setDeleting(true)}>
                Delete
              </button>
            </div>
          )}
          {deleting && (
            <div role="alert" className="mt-3">
              <p>Delete this post? It will disappear from the community.</p>
              <button
                className="mr-4 underline"
                onClick={async () => {
                  try {
                    await communityWrite("delete_post", { post_id: p.id });
                    await qc.invalidateQueries({ queryKey: ["community"] });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Delete failed.");
                  }
                }}
              >
                Confirm delete
              </button>
              <button onClick={() => setDeleting(false)}>Cancel</button>
            </div>
          )}
        </article>
      )}
      <section className="mt-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">Replies</h2>
          <select
            aria-label="Comment order"
            className="rounded-lg border bg-background p-2"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option>Oldest</option>
            <option>Newest</option>
          </select>
        </div>
        {p.locked ? (
          <p className="rounded-xl border p-4">
            This discussion is locked. Existing replies remain readable.
          </p>
        ) : (
          <ReplyForm postId={p.id} />
        )}
        <div className="mt-6 space-y-4">
          {comments.isPending ? (
            <p>Loading replies…</p>
          ) : comments.isError ? (
            <p role="alert">
              Could not load replies.{" "}
              <button onClick={() => comments.refetch()} className="underline">
                Retry
              </button>
            </p>
          ) : (
            <>
              {comments.data.length === 0 && (
                <p className="text-muted-foreground">
                  No replies yet. Be the first to add a thought.
                </p>
              )}
              {comments.data
                .filter((c) => !c.parent_id)
                .sort((a, b) =>
                  order === "Oldest"
                    ? a.created_at.localeCompare(b.created_at)
                    : b.created_at.localeCompare(a.created_at),
                )
                .map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    replies={comments.data.filter((r) => r.parent_id === c.id)}
                    locked={p.locked}
                  />
                ))}
              {comments.data.length === 1000 && (
                <p className="text-sm">Showing the first 1,000 replies.</p>
              )}
            </>
          )}
        </div>
      </section>
    </CommunityLayout>
  );
}
function ReplyForm({
  postId,
  parentId,
  onDone,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  return (
    <AccountGate>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await communityWrite("comment", { post_id: postId, parent_id: parentId, body });
            setBody("");
            await qc.invalidateQueries({ queryKey: ["community"] });
            onDone?.();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not send reply.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          Your reply
          <textarea
            required
            maxLength={8000}
            rows={3}
            className={`${inputClass} mt-2`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button disabled={busy} className={`${buttonClass} mt-3`}>
          {busy ? "Posting…" : "Post reply"}
        </button>
      </form>
    </AccountGate>
  );
}
function CommentRow({
  comment: c,
  replies = [],
  locked,
}: {
  comment: Comment;
  replies?: Comment[];
  locked: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [reply, setReply] = useState(false);
  const [mode, setMode] = useState<"edit" | "report" | "delete" | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const account = useCommunityAccount();
  const qc = useQueryClient();
  async function action() {
    if (!account.member || !account.profile.data) {
      toast.info("Sign in and choose a username before participating.");
      return;
    }
    setBusy(true);
    try {
      await communityWrite(
        mode === "edit" ? "edit_comment" : mode === "report" ? "report" : "delete_comment",
        { post_id: c.post_id, comment_id: c.id, body: text, reason: text },
      );
      setMode(null);
      await qc.invalidateQueries({ queryKey: ["community"] });
      if (mode === "report") toast.success("Report sent.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="rounded-xl border-l-2 bg-card p-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand comment" : "Collapse comment"}
          className="rounded border px-2 py-1"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "+" : "−"}
        </button>
        <span>
          u/{c.author?.handle ?? "member"}
          {c.edited_at ? " · edited" : ""}
          {collapsed ? ` · ${replies.length} replies` : ""}
        </span>
      </div>
      {!collapsed && (
        <>
          <p className="mt-3 whitespace-pre-wrap break-words">{c.body}</p>
          {c.status === "visible" && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              {!locked && !c.parent_id && (
                <button className="underline" onClick={() => setReply(!reply)}>
                  Reply
                </button>
              )}
              <button
                className="underline"
                onClick={() => {
                  setMode("report");
                  setText("");
                }}
              >
                Report
              </button>
              {account.user?.id === c.author_id && (
                <>
                  {!locked && (
                    <button
                      className="underline"
                      onClick={() => {
                        setMode("edit");
                        setText(c.body);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button className="underline" onClick={() => setMode("delete")}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
          {mode && (
            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void action();
              }}
            >
              {mode === "delete" ? (
                <p>Delete this reply? A placeholder will remain.</p>
              ) : (
                <label className="block text-sm">
                  {mode === "edit" ? "Edit reply" : "Reason for report"}
                  <textarea
                    required
                    minLength={mode === "report" ? 3 : 1}
                    maxLength={mode === "report" ? 1000 : 8000}
                    className={`${inputClass} mt-2`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </label>
              )}
              <button disabled={busy} className={buttonClass}>
                Confirm
              </button>
              <button type="button" className="ml-3" onClick={() => setMode(null)}>
                Cancel
              </button>
            </form>
          )}
          {reply && (
            <div className="mt-4">
              <ReplyForm postId={c.post_id} parentId={c.id} onDone={() => setReply(false)} />
            </div>
          )}
          <div className="mt-4 space-y-3">
            {replies.map((r) => (
              <CommentRow key={r.id} comment={r} locked={locked} />
            ))}
          </div>
        </>
      )}
    </article>
  );
}
