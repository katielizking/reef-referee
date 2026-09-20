# FishTankr Community Feature Plan

## Summary

Build FishTankr's social layer around structured help requests instead of a broad open forum. The first community feature should be **Tank checks**: shareable posts where users publish a tank setup, calculator result, tank-readiness context and a clear question for feedback.

This fits FishTankr because beginners want reassurance before adding fish, experienced fishkeepers like helping with specific setups, and the content naturally connects back to the calculator, tank log, visualiser, species pages and aquarium-shop directory.

## Product Goals

- Help beginners get practical feedback on real stocking plans and tank issues.
- Turn one-off calculator use into repeat visits.
- Create indexable user-generated pages around aquarium questions.
- Build community value without launching an empty general forum.
- Keep welfare advice calm, structured and safer than free-form social posting.
- Create future partnership surfaces for aquarium shops and experienced keepers.

## Recommended MVP

Launch with one structured community area:

**Tank checks**

Users can publish a tank setup and ask for feedback on:

- Stocking plan
- Compatibility
- Tank size
- Water readiness
- Behaviour concerns
- Adding more fish
- Beginner setup questions

Avoid launching many empty categories at once. Add broader areas once Tank checks has activity.

## Route Structure

| Route | Purpose |
|---|---|
| `/community` | Community landing page with featured Tank checks, filters and CTA |
| `/community/tank-checks` | Main browse page for Tank checks |
| `/community/tank-checks/new` | Guided post creation flow |
| `/community/tank-checks/:slug` | Public Tank check detail page |
| `/community/guidelines` | Posting and welfare guidance |
| `/community/profile/:handle` | Optional later user profile page |

## Navigation

Add **Community** to the main navigation once the feature is usable.

Cross-link from:

- Calculator results: "Ask for a tank check"
- Tank log readiness result: "Ask for help with these readings"
- Visualiser: "Share this tank"
- Species pages: "See Tank checks with this fish"
- Shop pages: "Mention where you bought supplies" only if user chooses to share

## Tank Check Post Anatomy

Each Tank check should be a structured page, not just a blank text post.

### Required Fields

- Post title
- Main question
- Tank volume or dimensions
- Freshwater/saltwater if saltwater is ever supported later
- Current fish list
- Planned fish list
- Experience level
- Visibility consent for public publishing

### Optional Fields

- Calculator score snapshot
- Tank readiness status
- Water parameters
- Tank age
- Filter/media maturity
- Plants and hardscape
- Photo or visualiser image
- Location/country for availability context, not exact address
- Shop or product notes
- Free-form notes

### Generated Summary

If the post comes from the calculator or tank log, auto-generate a readable summary:

> 60L planted community tank. Current plan: 8 neon tetras, 6 pygmy corydoras and 1 honey gourami. FishTankr flagged one caution: water hardness is near the upper range for neon tetras. Tank readiness is Caution because the latest water test is 12 days old.

The user can edit before publishing.

## Commenting Model

MVP comments should be simple:

- One-level comments only.
- Optional "helpful" reaction.
- Optional "I kept this species" tag on comments.
- Report button on every post and comment.
- Author can mark one response as "helpful".

Avoid deep nested threads in the first release. They are harder to moderate and harder to read on mobile.

## Community Categories

Start with Tank checks only. Prepare these categories for later:

| Category | Launch Timing | Notes |
|---|---:|---|
| Tank checks | MVP | Core feature |
| Stocking ideas | Phase 2 | Works well with tank templates |
| Water help | Phase 2 | Could be generated from Tank log |
| Species talk | Phase 3 | Attach to species pages once moderation is ready |
| Shop experiences | Phase 3 | Higher moderation and legal risk |
| Build journals | Phase 4 | Good for retention and photos |

## Data Model

### `community_posts`

- `id`
- `slug`
- `author_id`
- `author_display_name`
- `title`
- `question`
- `post_type`
- `status`
- `visibility`
- `tank_volume_litres`
- `tank_length_cm`
- `tank_width_cm`
- `tank_height_cm`
- `experience_level`
- `calculator_score`
- `readiness_status`
- `summary`
- `species_snapshot_json`
- `water_snapshot_json`
- `visual_snapshot_url`
- `tags`
- `helpful_comment_id`
- `created_at`
- `updated_at`
- `published_at`
- `deleted_at`

### `community_comments`

- `id`
- `post_id`
- `author_id`
- `author_display_name`
- `body`
- `experience_badge`
- `helpful_count`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`

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

## Post Statuses

| Status | Meaning |
|---|---|
| `draft` | User has not published |
| `published` | Public and indexable |
| `pending_review` | Held for moderation |
| `hidden` | Removed from public view |
| `deleted` | User or moderator deleted |

## Moderation and Safety

This is important because fishkeeping advice can become confident and wrong.

### MVP Rules

- Block or hold posts with abuse, spam, external pharmacy terms, scams or explicit content.
- Let users report comments and posts.
- Show a short disclaimer on public posts: community replies are personal experience, not a guarantee.
- Avoid "verified expert" claims unless a real verification process exists.
- Do not allow medical-style certainty for sick fish. Prompt users to seek an aquatic vet for serious disease, injury or mass deaths.
- Do not allow exact home addresses.
- Keep shop criticism factual and moderate aggressively if shop reviews are added later.

### Community Guidelines Copy

Use plain language:

- Be specific about your setup.
- Share test numbers where you can.
- Do not shame beginners.
- Explain the reason behind advice.
- Do not tell someone to add fish if ammonia or nitrite is present.
- If fish are dying, gasping or injured, suggest urgent specialist help.

## UX Flow

### From Calculator

1. User checks a stocking plan.
2. Results page offers: "Ask for a tank check".
3. New Tank check opens with tank size, fish list, score and warnings prefilled.
4. User adds their question and edits public details.
5. User publishes.
6. Post shows a public card and comment area.

### From Tank Log

1. User enters water parameters.
2. Readiness result is Caution, Not ready or Unknown.
3. CTA: "Ask for help with these readings".
4. New Tank check opens with water snapshot prefilled.

### From Visualiser

1. User builds a visual tank.
2. CTA: "Share this tank for feedback".
3. Tank check includes image or visualiser snapshot plus stocking summary.

## Page Layout

### Community Landing Page

- Hero: "Get a second opinion on your tank"
- Primary CTA: "Ask for a tank check"
- Secondary CTA: "Browse Tank checks"
- Featured filters:
  - Beginner setups
  - Nano tanks
  - Betta tanks
  - Community tanks
  - Water help
- Recent helpful discussions
- Guidelines teaser

### Tank Checks Browse Page

Filters:

- Tank size
- Freshwater type
- Species
- Status: unanswered, answered, helpful response
- Topic: stocking, water, compatibility, behaviour
- Experience level

Sort:

- Recent
- Most helpful
- Unanswered

Cards should show:

- Title
- Tank volume
- Key fish
- Main warning or question
- Comment count
- Readiness badge if present

### Tank Check Detail Page

Above the fold:

- Title
- Author display name and date
- Tank summary card
- Main question
- Calculator score badge if included
- Readiness badge if included

Body:

- Current stocking
- Planned stocking
- Water readings
- Notes
- Visual/photo
- Comments
- Related species and tank ideas

## SEO Plan

Tank checks can become long-tail SEO pages, but quality control matters.

### Indexing Rules

Index:

- Published posts with enough structured detail.
- Posts with at least one approved comment.
- Posts older than a short moderation window, such as 24 hours.

Noindex:

- Empty posts
- Posts with no comments
- Very thin posts
- Posts pending moderation
- Deleted or hidden posts

### Metadata

Example title:

`Can I keep neon tetras with a betta in a 60L tank? | FishTankr Tank Check`

Example description:

`A FishTankr community Tank check for a 60L planted tank with neon tetras, pygmy corydoras and a honey gourami. See the stocking notes, water readings and community feedback.`

### Structured Data

Use `QAPage` schema for Tank checks where there is a clear question and comments. Use `DiscussionForumPosting` if QAPage does not fit a given page.

## Anti-Spam Plan

MVP:

- Require anonymous auth session at minimum.
- Rate limit new posts and comments.
- Honeypot field on post/comment forms.
- Hold posts with many links.
- Hold first post from a new user if it contains external links.
- Report workflow.

Later:

- Reputation score.
- Trusted helper badges.
- Moderator queue.
- Automatic duplicate detection.

## Reputation and Badges

Do not overbuild at launch. Later badges can include:

- Helpful keeper
- Planted tank keeper
- Betta keeper
- Cory keeper
- Water testing helper
- Shop owner, only if verified

Badges should not imply medical, veterinary or legal authority unless verified.

## Analytics Events

Track:

- `community_viewed`
- `tank_check_started`
- `tank_check_prefilled_from_calculator`
- `tank_check_prefilled_from_tank_log`
- `tank_check_published`
- `tank_check_comment_added`
- `tank_check_helpful_marked`
- `community_report_submitted`
- `community_calculator_cta_clicked`
- `community_tank_log_cta_clicked`

## Success Metrics

MVP:

- Tank check publish rate from calculator results.
- Percentage of posts receiving a comment.
- Time to first helpful comment.
- Return visits by post authors.
- Clicks from Tank checks back into calculator and tank log.
- Organic impressions for indexed Tank check pages.

Quality:

- Report rate.
- Hidden/removed post rate.
- Percentage of thin posts noindexed.
- Beginner satisfaction feedback if added later.

## Implementation Phases

### Phase 1: Tank Checks MVP

- Routes for community landing, Tank checks list, new Tank check and detail.
- Basic data tables and RLS.
- Guided post form.
- Prefill from calculator and tank log.
- One-level comments.
- Report button.
- Noindex rules for thin or unreviewed posts.
- Basic analytics.

### Phase 2: Better Discovery

- Filters by tank size, species and topic.
- Related Tank checks on species pages.
- Related species/tank ideas on Tank check pages.
- Helpful answer marker.
- Improved share cards.

### Phase 3: Reputation and Moderation

- Trusted helper badges.
- Moderator queue.
- Better spam scoring.
- User profiles.
- Comment sorting.

### Phase 4: Wider Community

- Stocking ideas discussion.
- Species talk.
- Build journals.
- Shop experience discussions, with stronger moderation.

## Lovable Build Prompt

```text
Build a FishTankr Community feature focused on structured Tank checks, not a broad general forum.

Add routes:
- /community
- /community/tank-checks
- /community/tank-checks/new
- /community/tank-checks/:slug
- /community/guidelines

The MVP should let users publish a Tank check from scratch, from calculator results, or from the Tank log. A Tank check should include a title, question, tank size, current stocking, planned stocking, optional calculator score, optional tank readiness status, optional water readings, optional visual/photo, notes and tags.

Keep comments one-level only. Add helpful reactions, report buttons, basic moderation statuses and noindex rules for thin or unreviewed posts.

Add CTAs:
- Calculator result: "Ask for a tank check"
- Tank log result: "Ask for help with these readings"
- Visualiser: "Share this tank for feedback"

Keep the tone practical and supportive. Avoid shaming beginners. Do not mix community feedback into the calculator score.
```

