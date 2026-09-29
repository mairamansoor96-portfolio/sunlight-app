# Build plan

Scope comes from [SPEC.md](SPEC.md) → "One-week scope". This file breaks it into slices you can ship. Tick items as they land.

## Slice 1: foundation (this branch)

The goal is to upload a screenshot, pick one of three conditions, and wipe between before and after, entirely in the browser.

- [x] **Phase 0: Spec and guidance.** SPEC.md is in the repo. CLAUDE.md summarises the project and points every session to the spec.
- [x] **Phase 1: Scaffold.** Next.js static export, TypeScript, ESLint, Vitest, Playwright.
- [x] **Phase 2: Screenshot upload.** Pick, drag and drop, or paste. PNG, JPEG or WebP up to 20 MB, downscaled to 3000 px on the longest side. Plain-language errors. A sample screen for trying it out.
- [x] **Phase 3: Simulation engine.** A pure `Condition` interface, a registry, and `applyConditions` stacking (ready for scenarios). Every condition is labelled for honesty.
  - Dim room / battery saver (Environment, Modelled): linear-light gain plus shadow crush.
  - Blurred vision (Body, Modelled): three box blurs approximating a Gaussian, in linear light, scaled to image width.
  - Deuteranopia (Body, Modelled): Machado et al. (2009), in linear RGB, severity adjustable.
- [x] **Phase 4: Before-and-after slider.** Pointer, touch and keyboard (arrows, Shift+arrows, Page Up/Down, Home/End). `role="slider"` with a value text.
- [x] **Phase 5: Putting it together.** A picker grouped by family, a strength control, method text with an honesty label, and a debounced re-render.
- [x] **Phase 6: Checks.** Unit tests for the maths and for the UI's own WCAG contrast. Playwright e2e tests on desktop and phone.

## Visual language (done)

- [x] Proposal and specimen page, agreed and written into SPEC.md → "Visual language".
- [x] App restyled: tokens, self-hosted type, eye-chart hero, ruled picker with live thumbnails, trust marks, readouts, crop-marked frame, shutter wipe.
- [x] Tone strip under the comparison.
- [x] Live hero: the eye-chart headline runs through each condition (same model, as SVG filters), with a duochrome bar for colour vision. Tours every condition automatically (2 s each); the only control is Pause tour.
- [x] Header personality: a light meter (log lux scale, sun needle following the hero) and "Designed at 500 lux. Used at 100,000."
- [x] Settings column as an instrument control panel.

## Slice 2: measured sunlight (the headline feature)

- [x] Sunlight model written into SPEC.md: formula, viewing assumption, reflectances, light and phone presets, R table, sources.
- [x] Glare image that reproduces the reported contrast exactly (affine map in linear light), also run live in the hero.
- [x] Colour pairs found automatically (anti-aliasing ignored), plus tap-to-pick and keyboard colour inputs.
- [x] Report: indoors vs overcast, open shade and direct sun for the chosen phone, in plain language, with assumptions and sources.
- [ ] Source the two unsourced assumptions (0.5% diffuse reflectance; budget and mid-range full-screen brightness) and re-check the other figures at their primary pages.

## Slice 3: the rest of the MVP conditions

- [x] Protanopia and tritanopia (Modelled). Machado 2009 matrices, sharing one factory with deuteranopia; tritanopia carries the paper's reliability caveat.
- [ ] Cracked screen (Illustrative).
- [ ] Low-resolution budget display, washed-out colours (Modelled).
- [ ] Move processing into a Web Worker if large screenshots feel slow.

## Slice 4: experiences and sharing

- [ ] Glance test: a one-second flash, then "What was this screen asking you to do?"
- [ ] Three scenarios as stacked conditions. The wording should come from designer interviews.
- [ ] Shareable comparison images sized for LinkedIn.

## Later (from the spec)

Tremor tap, thumb reach, "what disappeared" overlay, stakeholder summary, live-URL mode, Figma plugin.
