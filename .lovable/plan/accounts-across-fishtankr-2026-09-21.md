# Accounts across FishTankr

Right now there is no way to create an account anywhere obvious. The only sign-in on the site is an email-link form buried inside the community page, and it is hidden behind a "the conversation opens soon" switch, so most visitors never see it. Everything else runs on an invisible guest session held in the browser.

This adds a normal sign up / sign in experience with presence on every page.

## What people will get

- A **Sign in** button in the site header (desktop and mobile menu). Once signed in it becomes an account menu showing their community name or email, with links to My tanks, Tracker, Community and **Sign out**.
- A dedicated **/auth** page with two tabs: **Create account** and **Sign in**.
  - Create account: email, password, confirm password.
  - Sign in: email, password, plus **Forgot password?**
  - A **Continue with Google** button on both tabs.
- A **/reset-password** page so the emailed reset link actually lets them set a new password.
- After creating an account, a short prompt to choose a community name (the same handle the community already uses), so one account works everywhere.
- Saved tanks and tracker tanks made as a guest **carry over** to the new account automatically, with a confirmation message saying so.
- Community sign-in stops being a separate flow: it uses the same account, and account creation is open now regardless of the community launch switch.
- Anywhere that currently says "saved tanks live in this browser and can disappear", the message changes to invite creating an account, since that is now the real answer. The existing email waitlist form is retired.

## Carrying guest tanks over

Guest sessions and real accounts are both accounts underneath, so signing up with email simply upgrades the current guest session in place: same identity, so saved tanks, tracker tanks and water tests stay attached with no copying.

Google sign-in cannot upgrade in place, so before starting it we remember the guest identity, and after the account exists a checked server-side step moves that guest's tanks, tracker tanks and water tests across. It only ever runs for the guest session that the same browser was actually using, and only onto an account that has no tanks of its own.

## Honest limits

- New accounts must confirm their email before they can post in the community; that is how the existing community rules are written. Until they confirm, they are signed in and can save tanks.
- Account emails come from the backend's built-in sender. If those emails land in spam for some people, we can point sending at your own domain later.

## Technical notes

- Enable email/password sign-in and configure the Google provider in the same change (`enable_email_auth`, `configure_social_auth` with `google`). Google goes through `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`, never raw `signInWithOAuth`.
- New routes: `src/routes/auth.tsx`, `src/routes/auth.callback.tsx`, `src/routes/reset-password.tsx`. All public, `noindex`, each with its own `head()`. No `_authenticated` layout is introduced: every page stays readable as a guest, which is deliberate.
- Sign-up path: if the current session is anonymous, call `supabase.auth.updateUser({ email, password })` to convert it; otherwise `supabase.auth.signUp`. Never treat sign-up as signed in beyond what the session reports.
- Shared session hook `src/lib/account.ts` (`useAccount`) exposing user, `isGuest`, `isMember`, handle and `signOut`. `useCommunityAccount` in `src/components/Community.tsx` is refactored to sit on top of it so there is one listener, not two.
- Header/account menu added to `SiteHeader` in `src/routes/__root.tsx`, driven by session state so a successful sign-in visibly changes the header. Sign-out order: `cancelQueries`, `queryClient.clear()`, `signOut()`, navigate home, then the root effect starts a fresh guest session.
- Claim step: `src/lib/claim.functions.ts`, a `createServerFn` with `requireSupabaseAuth` taking the old guest id, verifying via the admin client that the id is an anonymous user with no email, and reassigning `tanks`, `tracked_tanks` and `water_tests` `user_id`. Child tables (`tank_species` etc.) key off `tank_id`, so they need no change.
- Community changes: `AccountGate` no longer renders its own email form; unsigned visitors get a link to `/auth`. The `community_is_ready` switch keeps gating posting only, not sign-in.
- Password reset: `resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`; that page calls `updateUser({ password })` with no current password. A future signed-in password change would send `current_password`.
- Remove `src/components/WaitlistSignup.tsx` usages and its Resend "waitlist" notification branch, keeping the "post" branch intact.
- Copy stays Australian English, sentence case, no em dashes, and uses the existing field-notebook tokens.
- Verify with Playwright: create an account as a guest holding a saved tank, confirm the tank still appears, sign out, sign back in, then run lint, tests, typecheck and build.
