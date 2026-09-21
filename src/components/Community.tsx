import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { ArrowUp, ArrowDown, Bookmark, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  communityDb,
  communityWrite,
  FLAIRS,
  safeLink,
  communityPhotoUrl,
  type Post,
} from "@/lib/community";

export const inputClass = "w-full rounded-xl border bg-background p-3 text-sm";
export const buttonClass =
  "rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50";
export function useCommunityAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const member = !!user && !user.is_anonymous && !!user.email_confirmed_at;
  const profile = useQuery({
    queryKey: ["community", "profile", user?.id],
    enabled: member,
    queryFn: async () => {
      const { data, error } = await communityDb
        .from("community_profiles")
        .select("handle")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { handle: string } | null;
    },
  });
  const moderator = useQuery({
    queryKey: ["community", "moderator", user?.id],
    enabled: member,
    queryFn: async () => {
      const { data, error } = await communityDb.rpc("community_is_moderator");
      if (error) throw error;
      return data === true;
    },
  });
  return { user, ready, member, profile, moderator };
}
export function AccountGate({ children }: { children: ReactNode }) {
  const a = useCommunityAccount();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const launch = useQuery({
    queryKey: ["community", "launch"],
    queryFn: async () => {
      const { data, error } = await communityDb.rpc("community_is_ready");
      if (error) throw error;
      return data === true;
    },
  });
  if (launch.isPending) return <p role="status">Loading community…</p>;
  if (launch.isError)
    return (
      <p role="alert">
        Community is temporarily unavailable.{" "}
        <button className="underline" onClick={() => launch.refetch()}>
          Retry
        </button>
      </p>
    );
  if (!launch.data)
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-2xl">The conversation opens soon.</h2>
        <p className="mt-3 text-muted-foreground">
          We’re getting the community ready to welcome everyone. Posting and sign-in will open
          shortly.
        </p>
        <Link to="/tank-ideas" className="mt-4 block text-primary underline">
          Explore Tank Ideas while you wait →
        </Link>
      </div>
    );
  if (!a.ready) return <p role="status">Checking your account…</p>;
  if (!a.member)
    return (
      <form
        className="space-y-3 rounded-xl border bg-card p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: `${window.location.origin}/community` },
            });
            if (error) throw error;
            setSent(true);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not send sign-in link.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-xl font-semibold">Join the conversation</h2>
        <p className="text-sm text-muted-foreground">
          Read freely. Sign in by email to post, reply, vote or save. Your email is never shown
          publicly.
        </p>
        <label className="block text-sm">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            className={`${inputClass} mt-1`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button disabled={busy} className={buttonClass}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </button>
        {sent && (
          <p role="status">Check your inbox for the sign-in link. Return here after confirming.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your calculator draft stays on this device. Tanks saved under a guest session remain
          associated with that guest session; save a share link before switching accounts.
        </p>
      </form>
    );
  if (a.profile.isPending) return <p>Loading your profile…</p>;
  if (a.profile.isError)
    return (
      <p role="alert">
        Could not load your profile.{" "}
        <button className="underline" onClick={() => a.profile.refetch()}>
          Retry
        </button>
      </p>
    );
  if (!a.profile.data)
    return (
      <form
        className="space-y-3 rounded-xl border p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await communityWrite("profile", { handle });
            await qc.invalidateQueries({ queryKey: ["community", "profile"] });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Username unavailable.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-xl font-semibold">Choose your community name</h2>
        <p className="text-sm text-muted-foreground">
          3–24 characters. Start with a letter; use letters, numbers or underscores. This name
          appears on your posts.
        </p>
        <label className="block">
          Username
          <input
            required
            pattern="[a-zA-Z][a-zA-Z0-9_]{2,23}"
            minLength={3}
            maxLength={24}
            className={inputClass}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <button className={buttonClass} disabled={busy}>
          Save username
        </button>
      </form>
    );
  return <>{children}</>;
}
export function CommunityLayout({ children }: { children: ReactNode }) {
  const account = useCommunityAccount();
  return (
    <main className="mx-auto max-w-6xl px-4 py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/community" className="font-display text-3xl">
            The FishTankr community
          </Link>
          <p className="mt-2 text-muted-foreground">
            Your tanks. Your questions. Whatever’s on your mind.
          </p>
        </div>
        <Link to="/community/new" className={buttonClass}>
          + Create a post
        </Link>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">{children}</div>
        <aside className="space-y-5">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">A place for fish people</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Share a tank, ask a small question, compare equipment or talk about something you’ve
              learned. Flairs are optional signposts, not forms to fill in.
            </p>
            <Link to="/tank-ideas" className="mt-4 block text-sm text-primary underline">
              Explore Tank Ideas →
            </Link>
          </div>
          <div className="rounded-2xl border p-5">
            <h2 className="font-semibold">Keep it welcoming</h2>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Be kind. Critique the advice, not the keeper.</li>
              <li>Put animal welfare first; explain your experience and sources.</li>
              <li>No spam, harassment, personal details or animal sales.</li>
              <li>Only share content you have permission to use.</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Community advice is member-contributed. Reports go to moderators; they are not an
              emergency service.
            </p>
          </div>
          {account.member && (
            <div className="rounded-xl border p-4 text-sm">
              <p>{account.profile.data ? `u/${account.profile.data.handle}` : "Signed in"}</p>
              {account.moderator.data && (
                <Link to="/community/moderation" className="mt-3 block text-primary underline">
                  Moderation queue
                </Link>
              )}
              <button
                className="mt-3 underline"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) toast.error(error.message);
                  else window.location.assign("/community");
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
export function PostComposer({ post, onDone }: { post?: Post; onDone?: () => void }) {
  const account = useCommunityAccount();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [url, setUrl] = useState(post?.link_url ?? "");
  const [flair, setFlair] = useState(post?.flair ?? "General");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <AccountGate>
      <form
        className="space-y-5 rounded-2xl border bg-card p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (url && !safeLink(url)) {
            toast.error("Use a complete https:// link without embedded credentials.");
            return;
          }
          if (!body.trim() && !url) {
            toast.error("Add some text or a link.");
            return;
          }
          setBusy(true);
          try {
            const id = await communityWrite(post ? "edit_post" : "post", {
              post_id: post?.id,
              title,
              body,
              link_url: url,
              flair,
            });
            if (!post) {
              void notifyOwner({ data: { type: "post", title, flair } }).catch(() => {});
            }
            await qc.invalidateQueries({ queryKey: ["community"] });
            if (onDone) onDone();
            else await navigate({ to: "/community/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save post.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="text-2xl font-display">
          {post ? "Edit your post" : "What would you like to share?"}
        </h1>
        <label className="block text-sm">
          Title
          <input
            className={`${inputClass} mt-2`}
            required
            minLength={3}
            maxLength={180}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title"
          />
        </label>
        <label className="block text-sm">
          Post
          <textarea
            rows={8}
            maxLength={15000}
            className={`${inputClass} mt-2`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="A question, an update, a story… start anywhere."
          />
        </label>
        <label className="block text-sm">
          Photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || busy}
            className="mt-2 block w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
                file.size > 5 * 1024 * 1024
              ) {
                toast.error("Choose a JPG, PNG or WebP image under 5 MB.");
                return;
              }
              if (!account.user) return;
              setUploading(true);
              try {
                const ext =
                  file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
                const path = `${account.user.id}/${crypto.randomUUID()}.${ext}`;
                const { error } = await supabase.storage
                  .from("community-photos")
                  .upload(path, file, { contentType: file.type, upsert: false });
                if (error) throw error;
                setUrl(supabase.storage.from("community-photos").getPublicUrl(path).data.publicUrl);
                toast.success("Photo uploaded. Publish your post when ready.");
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? e.message
                    : "Upload failed. The limit is 50 photos per account.",
                );
              } finally {
                setUploading(false);
              }
            }}
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 5 MB. Photos are public once uploaded; only upload content you
            can share. One photo or link per post.
          </span>
        </label>
        {communityPhotoUrl(url) && (
          <img
            src={url}
            alt="Your post photo preview"
            className="max-h-80 w-full rounded-xl object-contain"
          />
        )}
        <label className="block text-sm">
          Link (optional)
          <input
            type="url"
            className={`${inputClass} mt-2`}
            maxLength={2000}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Share a photo album, video, article or your saved FishTankr tank link. Links open
            separately.
          </span>
        </label>
        <label className="block text-sm">
          Flair
          <select
            className={`${inputClass} mt-2`}
            value={flair}
            onChange={(e) => setFlair(e.target.value)}
          >
            {FLAIRS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <button disabled={busy || uploading} className={buttonClass}>
          {uploading ? "Uploading…" : busy ? "Saving…" : post ? "Save changes" : "Publish post"}
        </button>
      </form>
    </AccountGate>
  );
}
export function PostActions({ post }: { post: Post }) {
  const a = useCommunityAccount();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  const own = useQuery({
    queryKey: ["community", "actions", post.id, a.user?.id],
    enabled: a.member,
    queryFn: async () => {
      const [v, s] = await Promise.all([
        communityDb
          .from("community_votes")
          .select("value")
          .eq("post_id", post.id)
          .eq("user_id", a.user!.id)
          .maybeSingle(),
        communityDb
          .from("community_saves")
          .select("post_id")
          .eq("post_id", post.id)
          .eq("user_id", a.user!.id)
          .maybeSingle(),
      ]);
      if (v.error || s.error) throw v.error ?? s.error;
      return { vote: v.data?.value ?? 0, saved: !!s.data };
    },
  });
  async function act(action: string, payload: Record<string, unknown>) {
    if (!a.member || !a.profile.data) {
      toast.info("Open Create a post to sign in and choose a username first.");
      return;
    }
    setBusy(true);
    try {
      await communityWrite(action, { post_id: post.id, ...payload });
      await qc.invalidateQueries({ queryKey: ["community"] });
      if (action === "report") {
        setReport(false);
        toast.success("Report sent to the moderation queue.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center rounded-full bg-muted">
          <button
            aria-label="Upvote"
            aria-pressed={own.data?.vote === 1}
            disabled={busy || a.user?.id === post.author_id || (a.member && !own.data)}
            className="rounded-full p-2 aria-pressed:text-primary"
            onClick={() => act("vote", { value: own.data?.vote === 1 ? 0 : 1 })}
          >
            <ArrowUp size={18} />
          </button>
          <span aria-label="Post score">{post.score}</span>
          <button
            aria-label="Downvote"
            aria-pressed={own.data?.vote === -1}
            disabled={busy || a.user?.id === post.author_id || (a.member && !own.data)}
            className="rounded-full p-2 aria-pressed:text-primary"
            onClick={() => act("vote", { value: own.data?.vote === -1 ? 0 : -1 })}
          >
            <ArrowDown size={18} />
          </button>
        </div>
        <Link
          to="/community/$id"
          params={{ id: post.id }}
          className="flex gap-1 rounded-full bg-muted px-3 py-2"
        >
          <MessageCircle size={16} />
          {post.comment_count}
        </Link>
        <button
          className="flex gap-1 rounded-full px-3 py-2 hover:bg-muted"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${window.location.origin}/community/${post.id}`);
              toast.success("Link copied.");
            } catch {
              toast.error("Copy the link from your address bar.");
            }
          }}
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          disabled={busy || (a.member && !own.data)}
          aria-pressed={own.data?.saved ?? false}
          className="flex gap-1 rounded-full px-3 py-2 aria-pressed:text-primary hover:bg-muted"
          onClick={() => act("save", { saved: !own.data?.saved })}
        >
          <Bookmark size={16} />
          {own.data?.saved ? "Saved" : "Save"}
        </button>
        <button className="px-2 text-muted-foreground underline" onClick={() => setReport(!report)}>
          Report
        </button>
      </div>
      {report && (
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act("report", { reason });
          }}
        >
          <label className="w-full text-sm">
            Why are you reporting this post?
            <input
              required
              minLength={3}
              maxLength={1000}
              className={`${inputClass} mt-2`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button disabled={busy} className={buttonClass}>
            Send report
          </button>
          <button type="button" onClick={() => setReport(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <p className="text-xs text-muted-foreground">
        u/{post.author?.handle ?? "member"} ·{" "}
        {new Date(post.created_at).toLocaleDateString("en-AU", { timeZone: "UTC" })} · {post.flair}
        {post.locked ? " · Locked" : ""}
      </p>
      <Link
        to="/community/$id"
        params={{ id: post.id }}
        className="mt-3 block font-display text-2xl break-words"
      >
        {post.title}
      </Link>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
        {post.body}
      </p>
      {post.link_url && safeLink(post.link_url) && (
        <a
          href={safeLink(post.link_url)!}
          target="_blank"
          rel="ugc nofollow noopener noreferrer"
          className="mt-3 block truncate text-sm text-primary underline"
        >
          {new URL(post.link_url).hostname} ↗
        </a>
      )}
      <PostPhoto post={post} />
      <PostActions post={post} />
    </article>
  );
}

export function PostPhoto({ post }: { post: Post }) {
  const photo = communityPhotoUrl(post.link_url ?? "");
  return photo ? (
    <img
      src={photo}
      alt={post.title}
      loading="lazy"
      className="mt-4 max-h-[520px] w-full rounded-xl object-contain"
    />
  ) : null;
}
