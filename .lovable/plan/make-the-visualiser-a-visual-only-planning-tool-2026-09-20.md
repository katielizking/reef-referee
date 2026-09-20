# Make the visualiser a visual-only planning tool

## What will change

- Remove welfare scores, checklist, compatibility suggestions, setup checks, score sharing and printable welfare report from the visualiser page.
- Keep visual planning controls for tank size, equipment, fish, invertebrates, plants and hardscape so the scene remains fully editable.
- Keep calculator scoring and welfare results unchanged.
- Replace the calculator’s existing visualiser link with a clear action that opens the visualiser using the current unsaved stocking plan.
- Preserve existing saved-tank and remix links between the two pages.

## Technical details

- Split the shared workspace rendering by page mode instead of running visualiser-only plans through welfare presentation components.
- Use the existing shared tank draft provider for the direct calculator-to-visualiser hand-off, avoiding new database writes or URL payloads.
- Update the visualiser page metadata to describe visual planning rather than welfare scoring.
- Verify the calculator-to-visualiser flow, visualiser editing controls, mobile layout, accessibility labels, tests, type checking, lint and build.
