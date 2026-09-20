# Site themes and accessibility review

## Theme control

- Add an accessible light/dark toggle to the shared header on every page except the home page.
- Remember the chosen theme on the device and use the device preference on the first visit.
- Keep the home page in its existing dark presentation and prevent theme flashing while pages load.
- Define complete light and dark colour tokens so existing pages and controls remain consistent.

## Accessibility review and fixes

- Audit all pages against WCAG 2.2 AA, covering contrast, keyboard use, control names, form labels, landmarks, headings, focus visibility, motion preferences and mobile tap targets.
- Fix confirmed critical and warning issues without changing product behaviour or welfare rules.
- Use existing accessible controls where available and preserve visible status text alongside colour cues.

## Verification

- Check both themes on representative content and tool pages at desktop and mobile sizes.
- Run automated accessibility checks, keyboard checks, contrast measurements, tests, type checking, lint and the production build.
- Report any remaining limitations separately rather than claiming full compliance where it cannot be proven automatically.
