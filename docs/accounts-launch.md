# Account launch checks

## Behaviour

- Public pages stay available to guests. The shared account provider starts one guest session.
- Email conversion preserves the guest user ID. Supabase requires email verification before an anonymous user can add a password, so the guest flow is email, confirmation link, then password and confirmation.
- The email confirmation redirect is `/auth?setup=password`. Ordinary signup redirects to `/auth`; recovery redirects to `/reset-password`; Google uses Lovable Auth and `/auth/callback`.
- Email and Google sign-in capture the current guest proof before switching identities. The server verifies that proof and the destination account, then calls a service-role-only transactional RPC.
- Accounts with existing tanks or water tests are not overwritten or automatically merged. The callback explains when a transfer was skipped. Failed transfers retain their proof for retry.
- Saved tanks, tracked tanks and water-test queries are keyed by user ID and wait for a session. Community and header sign-out use the same path.
- Choosing a community name is independent of the posting launch switch. Posting still requires a confirmed member and the existing community rules.

## Deployment order

1. Run typecheck, tests, lint, format check and production build. Run GitHub quality checks on the PR.
2. Apply `supabase/migrations/20260921000100_account_completion.sql` before publishing the frontend. It is additive and compatible with the previous frontend. Never expose `claim_guest_data` to anonymous or authenticated database roles.
3. Run `supabase/tests/accounts.sql`. It rolls back its synthetic records and checks all three ownership transfers, retries, source validation and RPC permissions.
4. Verify the exact GitHub merge SHA is synced to the Lovable preview.
5. Complete the interactive checks below. Publish only after they pass.

## Interactive release gate

Use a controlled test account, not a member's existing account. Do not record credentials, tokens or confirmation links in logs, screenshots or PRs.

- Save a guest calculator tank and tracker tank with a water test.
- Create an email account. Verify email delivery, allowed redirect and the password setup screen. Choose a password and confirm the same tanks and water tests remain.
- Choose a community name. Confirm the header updates immediately.
- Sign out, sign back in and check saved tanks and tracker data. Confirm another account cannot see them.
- Request a password reset. Follow the email link and change the password. Invalid or expired links must not show a false success.
- Test Google sign-in from a guest with data into an empty controlled account. Check the transfer message and retained tank contents.
- Test an existing destination with data. It must not be overwritten.
- Check desktop and mobile header controls, calculator, tracker, saved tanks, community, tank ideas and visualiser. An unsupported WebGL device must retain the existing fallback.

Backend prerequisites: email and Google auth enabled, anonymous sign-in enabled, manual identity linking enabled, and the deployment origins plus the above redirects permitted by Auth. Real email delivery and Google consent require interactive verification; unit tests do not establish either.
