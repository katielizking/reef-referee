# Tank Ideas and Community

## What ships

- Six browsable Tank Ideas with individual URLs, layout diagrams, exact stocking lists, care notes, canonical metadata and sitemap entries. Opening an idea asks before replacing the calculator draft and resets equipment, readiness and saved-tank identity.
- Community: Hot/New/Top/Unanswered feeds, title search, flairs, pagination, text/link/photo posts, up/down votes, private saves, sharing, two-level replies, collapse, editing/deletion, reports, and a moderator queue.
- Email-confirmed accounts and public pseudonyms. Reading needs no account. Email magic links use the existing Supabase auth configuration; delivery must be verified with a real member account before declaring the account journey fully tested.
- Photos: JPG/PNG/WebP, 5 MB maximum, new object names, owner-scoped uploads, at most 50 stored photos per member. Uploaded photos are public even before posting. File removal requests can be handled by the owner or moderator through Storage. Hiding a reported photo post also attempts to remove its uploaded photo.
- Pea puffer scoring follows a group-care approach (6+, adequate footprint, dense cover, monitoring), including for old saved species snapshots. The reviewed species record links to the care source and acknowledges differing solitary-care guidance.

## Launch state and moderation

Participation is deliberately gated by `community_is_ready()`. It remains closed while `community_admin_emails` is empty. Only the database operator can change that table; no public or authenticated client has access. `community_is_moderator()` requires a matching **confirmed**, non-anonymous account.

Appointing the site owner's moderator email requires explicit approval. Automatic approval review rejected the initial assignment, so it has not been made. Do not work around that decision. Once the owner approves the specific email, the operator can add it; participation then opens without a code change. The owner signs in with that email, chooses a username and opens `/community/moderation`.

Unreviewed community threads initially carry `noindex,follow`; the public feed and curated Tank Ideas are indexable. This avoids treating newly submitted advice as reviewed editorial content. Thread indexing can be introduced alongside an editorial review workflow.

## Database and security

Apply migrations `20260920001000` through `20260920001300` in order. These add new tables, functions and a storage bucket; only `20260920001100` modifies an existing row (the pea puffer care record). Existing tank, tracker and catalogue policies are unchanged.

Clients have read-only table grants. Writes use checked functions that enforce confirmed identity, ownership, bans, per-member limits, thread locks and moderator authority. The internal write function is not executable by clients. Vote totals are serialized on the post row. Hidden posts and their replies are excluded by RLS; removed comments are replaced with tombstones. Reports and saves are private. No HTML is rendered from user posts; external links require HTTPS and use `ugc nofollow`.

`supabase/tests/community.sql` exercises writes, votes, ownership, moderator checks, locks, unsafe links and public RLS in a rolled-back transaction. It creates no permanent test accounts or posts. Storage policy review verifies only owner/moderator removal and verified-member uploads.

## Verification and rollback

Run `npm run typecheck`, `npm test`, and `npm run build`. Verify the exact git tree against the local staged tree before changing the connected branch. Compare all changed paths and preserve the complete repository, including deployment configuration.

Smoke-check `/`, `/calculator`, `/visualiser`, `/tracker`, `/species`, `/shops`, `/saved`, `/tank-ideas`, each idea, and `/community`. Validate template handoff quantities and replacement confirmation. Verify sign-in delivery, image upload and a real member's first post when participation is activated.

The additive database schema may remain during a code rollback. Pause participation by removing the approved moderator allowlist entry only with operator authorization; do not remove user data or drop tables as a rollback. Revert code with a new forward commit, never force-push or rewrite published history.

Care references reviewed 20 September 2026:

- https://www.pufferfishenthusiastsworldwide.com/post/c-travancoricus
- https://www.aquariumcoop.com/blogs/aquarium/pea-puffer
