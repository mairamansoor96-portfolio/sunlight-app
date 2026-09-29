# Sunlight

**Always read [SPEC.md](SPEC.md) before making changes.** It is the design spec and the source of truth for scope, conditions, honesty labels, copy tone and visual direction. If a request conflicts with the spec, point out the conflict before building. If you change product behaviour, say whether SPEC.md needs updating. [PLAN.md](PLAN.md) tracks the build phases and what has shipped.

## What it is

Sunlight shows designers their interfaces in the conditions real users live in: bright sun, cracked budget screens, poor eyesight, a one-second glance. The framing is that accessibility is about circumstances, not only disabilities. Designers upload a screenshot, pick a condition (or a stacked scenario), and wipe between before and after.

## Non-negotiables (from the spec)

- **Browser only.** No backend, no storage, no uploads, no running cost. The screenshot never leaves the device. Next.js is built as a static export (`output: "export"`). Don't add API routes, server actions or anything else that needs a server.
- **Honesty labels.** Every condition is labelled `measured`, `modelled` or `illustrative`, and shows its method text in the UI. Be conservative: a filter is not "measured" unless it's calculated from the screenshot's actual colours.
- **Sunlight passes its own tests.** The UI meets WCAG 2.x AA. Colour tokens in `app/globals.css` are contrast-checked by `tests/unit/theme.test.ts`. Add a pair to that test whenever you add a token.
- **Voice.** Warm, direct, slightly wry, never preachy. Tone example: "Looks great on your monitor. Let's go outside." In the UI: one plain fact first, then at most one dry line.
- **Visual language.** A field instrument for light: neutral paper and blue-black, one sun yellow used only as a fill, hairline rules, square corners, no shadows or pills. SPEC.md → "Visual language" has the tokens, type and rules. Follow it for all new UI.

## Stack and layout

- Next.js 16 (App Router), React 19, TypeScript (strict), plain CSS (`app/globals.css`, no Tailwind).
- `lib/simulations/`: the conditions library. Each condition is a pure `Condition` (`types.ts`) whose `apply(PixelBuffer, strength) → PixelBuffer` must not mutate its input. Register new ones in `index.ts`. `applyConditions` runs a stack in order, which is how scenarios work. Simulations that model light work in **linear light** (`color.ts`).
- `lib/loadImage.ts`: validates, decodes and downscales uploads (longest side capped at 3000 px).
- `lib/toneStrip.ts`: runs eleven L* greys through a condition stack and reports merged steps. `lib/thumbnail.ts`: area-averaged downscale for picker thumbnails.
- Each `Condition` also has `reading(strength)`, the real-units text shown in the comparison readout, and optionally `filter(strength)`, the same model as SVG filter steps for the live hero. `tests/unit/filter.test.ts` checks the two agree; keep them in sync when changing a model.
- `components/`: `LiveHero` (eye-chart headline run through conditions via SVG filters), `Studio` (state and rendering), `UploadZone` (pick, drop, paste), `ConditionPicker` (ruled rows with live thumbnails, radio group), `BeforeAfterSlider` (readouts, crop marks, shutter wipe, pointer and keyboard, `role="slider"`), `ToneStrip`, `TrustMark`/`TrustTag`, `PixelCanvas`.
- `app/fonts/`: self-hosted woff2 files and their licences. `npm run preview` embeds them.
- `scripts/`: `sample-screen.html` is the source of `public/sample-screenshot.png`. Regenerate it with `npm run sample`.

## Commands

```bash
npm run dev          # local dev server
npm run build        # static export to out/
npm run lint && npm run typecheck && npm test   # run before every commit
npm run test:e2e     # Playwright against out/ (build first)
npm run preview      # one-file preview in preview/ (published as a private claude.ai Artifact)
```

In Claude Code cloud sessions, Chromium is preinstalled. Prefix the Playwright commands (`test:e2e`, `sample`) with `CHROMIUM_PATH=/opt/pw-browsers/chromium` and don't run `playwright install`.

## Conventions

- Add a condition: a new file in `lib/simulations/`, then register it in `index.ts`, then add unit tests with known pixel values in `tests/unit/`. Cite the research in the file header and in `method`.
- Keep the maths pure and DOM-free so it can be unit-tested in Node and later moved to a Web Worker.
- Every interactive control works by keyboard and has an accessible name. Check new UI at 390 px wide.
- UK English in copy ("colour", "modelled").
