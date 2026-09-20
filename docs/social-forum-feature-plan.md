# FishTankr Reddit-Style Community Plan

## Summary

Build FishTankr Community as close to Reddit as possible while keeping it clearly focused on aquarium keeping. The core experience should be a feed of user posts, voting, comments, flairs, sorting, saving, reporting and lightweight moderation.

FishTankr tools should act like optional rich embeds. A user can attach a calculator result, tank log reading, visualiser snapshot, tank idea, species page or shop listing to a post, but the community should not feel like a structured form or support queue.

## Product Direction

The mental model is:

> Reddit for aquariums, with optional FishTankr tank context.

Do not make Tank checks the whole product. A Tank check is just one flair. People should be able to post whatever hobbyists naturally post:

- "What is this algae?"
- "Can I keep these together?"
- "Rate my tank."
- "Before and after rescape."
- "Is this shop legit?"
- "My nitrite spiked, what now?"
- "What fish would you add?"
- "Look at this tiny plant growth."
- "Beginner mistake, help."

The community should feel open-ended, browseable and a little addictive, not like a questionnaire.

## Product Goals

- Make FishTankr a repeat-visit aquarium destination, not only a calculator.
- Let users create flexible posts with minimal friction.
- Use votes and comments to surface useful community knowledge.
- Build long-tail SEO through real aquarium questions and discussions.
- Let user behaviour reveal the best content categories over time.
- Connect discussion back to calculator, tank log, visualiser, tank ideas, species pages and shop directory.
- Keep moderation strong enough for beginner safety, spam control and shop-related risk.

## Reddit-Like MVP

The MVP should include:

- Main community feed.
- Post creation with title, body, flair and optional images/embeds.
- Upvote/downvote or upvote-only voting.
- Comment threads.
- Sorting by Hot, New, Top and Unanswered.
- Flairs instead of rigid post types.
- Save post.
- Share post.
- Report post/comment.
- Basic user profiles.
- Moderator/admin controls.

## Route Structure

| Route | Purpose |
|---|---|
| `/community` | Main Reddit-style feed |
| `/community/new` | Create a post |
| `/community/p/:slug` | Post detail page |
| `/community/flair/:flair` | Filtered feed by flair |
| `/community/top` | Top posts |
| `/community/newest` | New posts |
| `/community/unanswered` | Posts with no comments |
| `/community/saved` | Saved posts for signed-in users |
| `/community/users/:handle` | Public user profile |
| `/community/guidelines` | Rules and posting guidance |
| `/community/mod` | Moderator queue, admin-only |

## Feed Design

The main feed should look and behave like a modern, cleaner Reddit feed.

### Feed Sorts

- **Hot**: ranked by votes, comments and freshness.
- **New**: newest posts first.
- **Top**: most voted posts for a period.
- **Unanswered**: posts with no comments.
- **Rising**: optional later sort for posts gaining traction.

### Top Time Ranges

- Today
- This week
- This month
- All time

### Feed Cards

Each post card should show:

- Vote control and score.
- Title.
- Flair.
- Author handle.
- Time since posted.
- Comment count.
- Thumbnail if image/visualiser is attached.
- Short body excerpt.
- Optional embed indicator: calculator, water log, species, shop, tank idea.
- Save, share and report actions.

Keep cards compact and scannable on mobile.

## Flairs

Use flairs as Reddit-style lightweight categorisation. Flairs should be visible, filterable and editable by the author or moderators.

Recommended initial flairs:

| Flair | Use |
|---|---|
| Question | General aquarium question |
| Help | Something is wrong and the user needs advice |
| Tank check | Feedback on stocking, setup or compatibility |
| Water parameters | Cycle, ammonia, nitrite, nitrate, pH, GH, KH |
| Show my tank | Photos, visualiser scenes, updates |
| Stocking ideas | Asking what to add or planning a setup |
| Species talk | Fish, plants, inverts and behaviour |
| Gear | Filters, lights, heaters, test kits, tanks |
| Shops | Online/local shop experiences and availability |
| Tank ideas | Discussing templates or inspiration setups |
| Beginner | New fishkeeper questions |
| Build journal | Ongoing tank progress |
| Discussion | Open-ended hobby discussion |

Users should pick one flair. Tags can be optional secondary metadata later.

## Post Composer

The composer should be very lightweight.

Required:

- Title.
- Body, image or link. At least one content field is required.
- Flair.

Optional:

- Images.
- Link.
- Calculator result embed.
- Tank log/water reading embed.
- Visualiser snapshot embed.
- Species links.
- Tank idea link.
- Shop listing link.
- Tank size.
- Country/region.

Composer layout:

1. Title.
2. Flair.
3. Tabs or blocks for Text, Image, Link and FishTankr embed.
4. Preview.
5. Publish.

Important: do not start with a long wizard. Reddit works because posting is quick.

## FishTankr Embeds

Embeds should feel like rich cards inside a normal post.

### Calculator Embed

Shows:

- Tank volume.
- Main species list.
- Stocking score.
- Key warnings.
- CTA: "Open in calculator".

### Tank Log Embed

Shows:

- Readiness status.
- Latest ammonia, nitrite, nitrate and pH if available.
- Test date.
- CTA: "Open tank log".

### Visualiser Embed

Shows:

- Visual snapshot.
- Tank size.
- Featured species.
- CTA: "Open visualiser".

### Species Embed

Shows:

- Common name.
- Scientific name.
- Care level.
- CTA: "View species".

### Shop Embed

Shows:

- Shop name.
- Online/local badge.
- Region.
- CTA: "View listing".

Embeds should be removable before publishing.

## Comments

Comments should be Reddit-like, but keep MVP complexity under control.

MVP:

- Comment on posts.
- Reply to comments to one or two levels deep.
- Upvote comments.
- Sort comments by Best, New and Top.
- Collapse comment threads.
- Report comments.
- Author and moderator delete/hide.

Later:

- Full nested threading.
- Awards or thanks.
- Comment search.
- Auto-collapse low-score comments.

## Voting

Choose one voting model:

### Recommended MVP: Upvote-Only

Pros:

- Friendlier for beginners.
- Less likely to become harsh or pile-on driven.
- Still supports ranking.

Cons:

- Less Reddit-authentic.
- Harder to bury bad advice without moderation.

### More Reddit-Like: Upvote and Downvote

Pros:

- Stronger ranking signal.
- Feels more like Reddit.
- Community can push poor advice down.

Cons:

- Can feel unfriendly to beginners.
- Needs stronger anti-abuse controls.

Recommendation: launch with **upvote-only for posts and comments**, then consider downvotes once moderation and user trust are stronger.

## Ranking

### Hot Feed

Use a simple weighted score:

- Upvotes.
- Comment count.
- Recency.
- Author reputation later.
- Penalty for reports or hidden comments.

Do not let old posts dominate the default feed forever.

### Top Feed

Sort by votes in selected time range.

### Unanswered Feed

Show posts with zero comments, prioritising Question, Help, Tank check and Water parameters flairs.

## User Profiles

Basic profiles should include:

- Handle.
- Avatar or initials.
- Bio.
- Country/region optional.
- Joined date.
- Posts.
- Comments.
- Saved posts private to user.
- Karma/helpfulness score optional later.

Do not require users to expose real names.

## Moderation

A Reddit-like community needs moderation from day one.

### Moderator Tools

- View report queue.
- Hide/unhide post.
- Hide/unhide comment.
- Lock post.
- Change flair.
- Mark as spam.
- Ban or suspend user.
- Pin moderator comment.
- Pin announcement post.

### Safety Rules

- No abuse or beginner shaming.
- No spam or fake shop promotion.
- No exact home addresses.
- No illegal animal trade or restricted species promotion.
- No confident medical-style claims for sick or dying fish.
- No telling users to add fish when ammonia or nitrite is present.
- Shop criticism must be factual and fair.

### Report Reasons

- Spam.
- Abuse or harassment.
- Unsafe animal advice.
- Misinformation.
- Shop/business claim concern.
- Personal information.
- Off-topic.
- Other.

## Data Model

### `community_posts`

- `id`
- `slug`
- `author_id`
- `author_handle`
- `title`
- `body`
- `flair`
- `status`
- `visibility`
- `score`
- `upvote_count`
- `downvote_count`
- `comment_count`
- `report_count`
- `link_url`
- `image_urls`
- `embed_type`
- `embed_snapshot_json`
- `species_ids`
- `shop_id`
- `tank_idea_id`
- `tank_volume_litres`
- `country_code`
- `is_locked`
- `is_pinned`
- `created_at`
- `updated_at`
- `published_at`
- `last_activity_at`
- `deleted_at`

### `community_comments`

- `id`
- `post_id`
- `parent_comment_id`
- `author_id`
- `author_handle`
- `body`
- `status`
- `score`
- `upvote_count`
- `downvote_count`
- `report_count`
- `depth`
- `created_at`
- `updated_at`
- `deleted_at`

### `community_votes`

- `id`
- `target_type`
- `target_id`
- `user_id`
- `vote_value`
- `created_at`
- `updated_at`

### `community_saves`

- `id`
- `user_id`
- `post_id`
- `created_at`

### `community_reports`

- `id`
- `target_type`
- `target_id`
- `reporter_id`
- `reason`
- `details`
- `status`
- `created_at`
- `resolved_at`

### `community_users`

- `user_id`
- `handle`
- `display_name`
- `avatar_url`
- `bio`
- `country_code`
- `karma_score`
- `helpful_score`
- `is_moderator`
- `created_at`
- `updated_at`

## SEO Plan

Community pages can be excellent long-tail SEO if thin content is controlled.

### Index

- Public posts with enough text, images or useful embedded context.
- Posts with comments.
- Questions with useful answers.
- High-quality Show my tank posts with captions.
- Tank check and water parameter posts with meaningful details.

### Noindex

- Very thin posts.
- Posts with no comments and little body text.
- Pending moderation.
- Hidden/deleted/locked for rule issues.
- Duplicates.
- User saved pages and mod pages.

### Structured Data

- Use `DiscussionForumPosting` for standard posts.
- Use `QAPage` only when a Question/Help post has clear answers.
- Use `ImageObject` metadata for image-heavy tank posts.

## UX Flows

### From Community

1. User opens `/community`.
2. User browses Hot feed.
3. User filters by flair or sort.
4. User opens a post, votes, comments or saves.
5. User starts a post with minimal required fields.

### From Calculator

1. User finishes a stocking calculation.
2. CTA: "Ask the community".
3. Composer opens with Tank check flair selected.
4. Calculator embed is attached.
5. User writes a normal post and publishes.

### From Tank Log

1. User sees concerning readings.
2. CTA: "Ask about these readings".
3. Composer opens with Water parameters flair selected.
4. Tank log embed is attached.
5. User writes a normal post and publishes.

### From Visualiser

1. User previews tank.
2. CTA: "Share to Community".
3. Composer opens with Show my tank flair selected.
4. Visualiser snapshot is attached.
5. User writes a caption and publishes.

## Analytics Events

- `community_feed_viewed`
- `community_sort_changed`
- `community_flair_filtered`
- `community_post_started`
- `community_post_published`
- `community_post_viewed`
- `community_post_upvoted`
- `community_post_saved`
- `community_post_shared`
- `community_comment_added`
- `community_comment_upvoted`
- `community_report_submitted`
- `community_embed_added`
- `community_embed_removed`
- `community_tool_cta_clicked`

## Success Metrics

MVP:

- Posts per week.
- Comments per post.
- Percentage of posts receiving a comment.
- Repeat visits from posters and commenters.
- Vote rate.
- Save rate.
- Tool-to-community post starts.
- Community-to-tool clicks.
- Organic impressions and clicks for indexed posts.

Quality:

- Report rate.
- Removed post/comment rate.
- Unanswered Help/Question post ratio.
- Beginner posts receiving useful comments.
- Spam rate.

## Implementation Phases

### Phase 1: Reddit-Like MVP

- Community feed with Hot, New, Top and Unanswered.
- Create post with title, body/image/link, flair and optional FishTankr embed.
- Post detail page.
- Comments with one or two reply levels.
- Upvote-only voting.
- Save/share/report actions.
- Basic user profiles.
- Moderator report queue.
- SEO noindex rules for thin/unreviewed content.

### Phase 2: Better Discovery

- Flair pages.
- Species-linked community posts.
- Related posts on species, tank ideas and shop pages.
- Better image thumbnails.
- Comment sorting.
- Pinned posts and announcements.

### Phase 3: Trust and Reputation

- Karma/helpfulness score.
- Trusted helper badges.
- Moderator badges.
- Better anti-spam scoring.
- Duplicate question detection.
- User following or saved filters.

### Phase 4: Richer Reddit Features

- Full nested comments.
- Downvotes if wanted.
- Polls.
- Build journal collections.
- Weekly pinned discussion threads.
- Verified shop owner accounts.

## Lovable Build Prompt

```text
Rework FishTankr Community to be as similar to Reddit as possible, while staying focused on aquarium keeping.

Build a Reddit-style community with:
- /community main feed
- /community/new create post
- /community/p/:slug post detail
- /community/flair/:flair filtered feeds
- /community/top
- /community/newest
- /community/unanswered
- /community/saved
- /community/users/:handle
- /community/guidelines
- /community/mod for moderators

The main feed should have Reddit-like sorting:
- Hot
- New
- Top
- Unanswered
- Rising later if easy

Use flairs instead of rigid post types. Initial flairs:
- Question
- Help
- Tank check
- Water parameters
- Show my tank
- Stocking ideas
- Species talk
- Gear
- Shops
- Tank ideas
- Beginner
- Build journal
- Discussion

The create-post flow should be quick and Reddit-like. Required fields:
- Title
- Flair
- Body, image or link

Everything else is optional. Users can attach FishTankr embeds:
- Calculator result
- Tank log/water readings
- Visualiser snapshot
- Species page
- Tank idea
- Shop listing

If the user comes from the calculator, open the composer with Tank check flair and a calculator embed attached. If they come from the Tank log, use Water parameters flair and attach readings. If they come from the Visualiser, use Show my tank flair and attach the visual snapshot. The user can remove the embed or change the flair.

Build post cards with vote controls, score, title, flair, author, time, comment count, thumbnail, save/share/report actions and optional embed indicators.

Build post detail pages with voting, comments, nested replies to one or two levels, comment sorting by Best/New/Top, report actions and save/share.

Launch with upvote-only voting for posts and comments so the community feels beginner-friendly. Keep the data model flexible enough to support downvotes later.

Add moderation tools:
- report queue
- hide/unhide post
- hide/unhide comment
- lock post
- change flair
- mark spam
- pin moderator comment
- pin announcement post

Add SEO controls:
- index useful public posts
- noindex thin posts, pending moderation, hidden/deleted posts, saved pages and mod pages
- use DiscussionForumPosting schema for normal posts and QAPage only for clear answered questions

The result should feel like a clean, modern aquarium subreddit inside FishTankr, not a structured support form.
```

