# Sunlight — Design Spec (copy of the Claude Doc, Sep 29 2026)

## Overview

Sunlight shows designers their interfaces in the conditions real users live in: bright sun, cracked budget screens, poor eyesight, a shaking bus, a one-second glance.

Its value comes from design knowledge, not an AI model. That makes it a stronger portfolio signal than an AI wrapper. It continues directly from designing an audio app for slow connections, older devices, and people new to smartphones.

The framing is deliberate: **accessibility is about circumstances, not only disabilities.** Everyone is situationally impaired sometimes.

It runs entirely in the browser with image filters and colour maths. No backend, no storage, no running cost.

## Conditions library

Conditions are grouped into four families. The grouping itself argues that accessibility is situational.

| Family | Conditions | Label | In MVP |
| --- | --- | --- | --- |
| Environment | Direct sunlight glare | Measured | Yes |
| Environment | Dim room at night, battery-saver dimming | Modelled | Yes |
| Environment | Night-shift warm tint | Modelled | Later |
| Environment | Rain or fingerprint smudges | Illustrative | Later |
| Device | Cracked screen | Illustrative | Yes |
| Device | Low-resolution budget display, washed-out colours | Modelled | Yes |
| Device | Small screen, dead pixels | Illustrative | Later |
| Body | Blurred vision, missing reading glasses | Modelled | Yes |
| Body | Colour blindness: deuteranopia, protanopia, tritanopia (Machado et al. 2009) | Modelled | Yes |
| Body | Age-related yellowing of vision | Modelled | Later |
| Body | Hand tremor | Interactive | Later |
| Situation | One-second glance | Interactive | Yes |
| Situation | One-handed thumb use | Interactive | Later |
| Situation | Walking, shaking bus | Illustrative | Later |

## Measured outdoor contrast

This is the feature that makes Sunlight serious rather than a set of filters. Sunlight reflecting off a screen adds light to both text and background, which crushes contrast, and that can be calculated.

WCAG contrast compares the relative luminance of two colours. Outdoors, reflected light adds the same amount to both:

```latex
C_{outdoor} = \frac{L_{light} + 0.05 + R}{L_{dark} + 0.05 + R}
```

R is the reflected ambient light, relative to the screen's maximum brightness. It depends on how bright the surroundings are, how reflective the screen is, and how bright the phone can go.

**How it works in the product:**

1. Sample text and background pixel colours from the screenshot.
2. Compute indoor contrast the standard way.
3. Recompute with R for presets like shade, overcast, and direct sun on a mid-range phone.
4. Report plainly: "Your body text passes indoors. In afternoon sun on a mid-range phone, it drops below the minimum."

**Open question:** choose defensible R values for each preset from published display-reflectance and outdoor-illuminance figures, and cite them in the product. *Answered below in "Sunlight model" (29 Sep 2026); the reflectance figures still want a better primary source.*

### Sunlight model

**Label:** Measured, with its assumptions stated next to every number. The colours come from the screenshot. The light is estimated from the published figures below, and the product shows those figures and their sources wherever it shows a result.

**Viewing assumption.** The viewer tilts the phone so the sun's mirror image is not in view. Nobody can read a screen with the sun reflected in it, so that case is excluded, and the product says so. What remains is:

- the screen mirroring the bright sky and surroundings (specular reflection), and
- a little of the direct sun scattered by the screen's layers (diffuse reflection).

**Reflected luminance** (cd/m², Lambertian approximation):

```
L_reflected = (ρ_specular × E_surround + ρ_diffuse × E_sun) / π
R           = L_reflected / L_phone
```

**Assumptions**

| Symbol | Value | Basis |
| --- | --- | --- |
| ρ_specular | 4.5% | Lowest average screen reflectance DisplayMate has measured on a phone (iPhone X, 2017). Uncoated glass reflects about 4% per surface. Using the best measured phone keeps the model optimistic. |
| ρ_diffuse | 0.5% | **Assumption, not yet sourced.** Scattering from the display stack for light arriving outside the mirror direction. Needs a published measurement. |
| E_surround, E_sun | see presets | Typical outdoor illuminance tables (below). |
| L_phone | see presets | Full-screen white in the phone's outdoor boost mode, not the HDR highlight peak in marketing. |

**Light presets** (illuminance falling on the screen)

| Preset | E_surround | E_sun | Basis |
| --- | --- | --- | --- |
| Overcast | 10,000 lux | 0 | Bright overcast. Microsoft's table puts "cloudy outdoors" at 10,001–30,000 lux. Other tables go down to 1,000 lux for a dull day, so this is not a worst case. |
| Open shade | 15,000 lux | 0 | Sunny day, out of direct sun. "Full daylight, not direct sun" is typically 10,000–25,000 lux. |
| Direct sun | 20,000 lux | 80,000 lux | Clear midday: about 100,000 lux in total, the top of Microsoft's "direct sunlight" range (30,001–100,000). |

**Phone presets** (L_phone)

| Preset | L_phone | Basis |
| --- | --- | --- |
| Budget phone | 500 nits | **Assumption.** Typical of budget LCD panels. Needs a measured source. |
| Mid-range phone | 1,000 nits | **Assumption.** Between budget panels and flagships. The default preset. |
| Flagship phone | 1,600 nits | Recent Samsung and Apple flagships exceed 1,500 nits in direct sunlight. The 2,600–3,300 nit figures are small-area HDR peaks and aren't used. |

**Resulting R** (reflected nits ÷ phone nits)

| | Budget | Mid-range | Flagship |
| --- | --- | --- | --- |
| Overcast (143 nits reflected) | 0.29 | 0.14 | 0.09 |
| Open shade (215 nits) | 0.43 | 0.21 | 0.13 |
| Direct sun (414 nits) | 0.83 | 0.41 | 0.26 |

Worked example, `#767676` on white (4.54:1 indoors, just passing AA), mid-range phone: overcast 3.19:1, open shade 2.84:1, direct sun 2.27:1. Even black on white falls to 3.16:1 in direct sun on a mid-range phone.

**The glare image.** The simulated screenshot must show exactly the contrast the numbers report. In linear light, each channel Y becomes

```
Y' = a·Y + b,   a = 1.05 / (1.05 + R),   b = a·(0.05 + R) − 0.05
```

This keeps white at white (the eye adapts to the brightest thing on screen) and makes the WCAG ratio of any two rendered colours equal C_outdoor. It is an affine map in linear light, so the live hero can run it as an SVG filter too.

**Colour pairs**

- **Automatic:** find the screenshot's most common colours, keep pairs that sit next to each other often (text on its background, a button label on its fill), and report the lowest-contrast ones first. Near-identical neighbours below 1.25:1, such as hairline dividers, are skipped.
- **Manual** ("Test a specific bit of text"): tap the text, then its background, in the screenshot. There is also a keyboard-operable colour input for each, so the feature passes Sunlight's own tests.

**Thresholds:** 4.5:1 is shown as the pass line, because we can't tell body text from large text in a screenshot. The report notes that large text (24 px, or 18.66 px bold) and interface components need 3:1.

**Report**, titled "Can people still read it outside?", in plain language. It explains the score once ("how much the text stands out: 4.5 or higher is readable"), then summarises: "4 of 12 text colour combinations are readable indoors. In direct sun on a mid-range phone, none are." It names the hardest to read. Each combination is described in words ("light grey text on off-white", with hex codes as small print) and scored indoors and under all three lights for the chosen phone, with Readable or Too faint written in words, not shown by colour alone. "Show where" dims the screenshot except where that combination is used (hover or focus previews it). Anti-aliased edges of other text in the same colours can light up too.

**Sources** (shown in the product)

- Microsoft Learn, "Understanding and Interpreting Lux Values" (ambient light sensor ranges): https://learn.microsoft.com/en-us/windows/win32/sensorsapi/understanding-and-interpreting-lux-values
- Typical daylight illuminance (overcast ~1,000; full daylight 10,000–25,000; direct sun 32,000–100,000 lux), e.g. CineD, "Shedding Light on Lumens, Lux and Latitude": https://www.cined.com/shedding-light-lumens-lux-latitude/
- DisplayMate via 9to5Mac, iPhone X lowest measured screen reflectance, 4.5%: https://9to5mac.com/2017/11/06/displaymate-iphone-x-display-rating/
- Glass reflects about 4% per surface at normal incidence: Lambda Research, "Sunlight Readable Display Design": https://lambdares.com/news/sunlight-readable-display-ambient-contrast-tracepro
- Flagship outdoor brightness above 1,500 nits: Yahoo Tech display tests: https://tech.yahoo.com/phones/articles/phone-display-best-ran-5-043000010.html

**Still to source:** ρ_diffuse (0.5%), and measured full-screen outdoor brightness for budget and mid-range phones. These were read from search summaries only, because the primary pages weren't reachable when this was written; verify before publishing the case study.

## Interactive tests

Filters show a problem; interactive tests make the designer feel it.

**Glance test (MVP).** The screen flashes for one second and disappears. Sunlight asks: "What was this screen asking you to do?" Quick, memorable, and humbling on your own work.

**Tremor tap (later).** The user tries to tap a button with a jittering cursor, and Sunlight counts the attempts. Highly shareable as a screen recording.

**Thumb reach (later).** An overlay of comfortable thumb zones on common phone sizes, so a primary action in the top corner becomes impossible to ignore.

## Scenarios instead of settings

Instead of checkboxes, Sunlight offers stacked scenarios drawn from real lives. Each applies several conditions at once and turns an audit into visible empathy.

| Scenario | Conditions stacked |
| --- | --- |
| 64, left her reading glasses at home, at a bus stop at noon | Direct sun, blurred vision |
| Delivery rider, one hand, cracked budget phone, walking | Cracked screen, budget display, one-handed, motion |
| Checking a bank balance at night in bed | Dim room, battery-saver dimming, night-shift tint |

All three can ship in the MVP using the MVP conditions; the extra conditions enrich them later. Scenario wording should come from real interviews, not invention.

## Outputs and sharing

Every output is built to be shown to someone else, which is also how Sunlight spreads.

- **Before-and-after slider** that wipes between the original and the chosen condition (MVP).
- **"What disappeared" overlay** highlighting regions that became unreadable (later).
- **One-page summary** for a stakeholder deck: "Here's why the grey text has to go" (later).
- **Comparison images** sized for LinkedIn, so the sharing loop is built into the product (MVP).

## Honesty labels and limitations

Every condition carries a visible label, so designers know how much to trust it.

- **Measured:** calculated from the screenshot's actual colours, like outdoor contrast.
- **Modelled:** based on established research, like colour-blindness simulation.
- **Illustrative:** a realistic impression, not a measurement, like a cracked screen or rain.

**Known limitation, stated in the product:** a screenshot can't show how a layout reflows when someone sets large text on their phone. A live-URL mode could address this later.

## Personality and visual direction

Sunlight is warm, bright, and confident, with a little cheek about designers working on perfect monitors in perfect light.

- **Look:** sunlit warmth, not a generic accessibility-checker palette.
- **Copy:** direct and slightly wry, never preachy. "Looks great on your monitor. Let's go outside."
- **Signature detail:** Sunlight's own interface passes every test it offers. A footer invites people to run Sunlight through Sunlight.

## Visual language

Agreed 29 Sep 2026 from the specimen page. Sunlight looks like a **field instrument for light**: precise, legible and quiet around the thing being measured.

**Principles**

- **Neutral around the image.** Designers judge colour here, so the interface is near-white and blue-black and never tints a screenshot.
- **Warmth comes from the sun.** One strong yellow, used only as a fill for things you touch. Never used for text.
- **Readings, not decoration.** Labels are real values: brightness, severity, L*, contrast ratios, the research behind a model.
- **Pass our own tests.** WCAG AA throughout, and nothing relies on colour alone.

**Colour:** Paper `#F6F6F3` (background), White `#FFFFFF` (frame, selected rows), Shade `#161C2B` (text, rules; the blue-black of daylight shadow), Shade 2 `#4A5266` (secondary text), Rule `#D3D6DC` and Rule strong `#7B8294` (row rules, control borders), Sun `#FFC400` (fills), Signal `#C4231A` (errors and destroyed tones only).

**Type:** Optician Sans (eye-chart optotypes) for the wordmark and hero only, uppercase. Atkinson Hyperlegible Next (designed with the Braille Institute for low-vision readers) for everything you read. Atkinson Hyperlegible Mono for readings, values and section labels. All self-hosted, all OFL.

**Form:** square corners (2 px), hairline rules instead of cards, no shadows, no gradients, no pills. The screenshot sits in a frame with crop marks. Circles are reserved for the sun handle, the selected-row marker, trust marks and panel screws.

**Header: a light meter.** Beside the wordmark is the line "Designed at 500 lux. Used at 100,000." Under it is a log scale of real light levels, 1 to 100,000 lux, with landmarks: dark bedroom (~1), your desk (500, the EN 12464-1 office level), overcast (10,000) and direct sun (100,000, from the Sunlight model). A sun-disc needle follows the live hero's tour, and a readout names the level. Conditions that don't change the light (blur, colour vision) leave the needle at the desk. Landmark names drop on narrow screens. The meter mirrors the hero, so it's hidden from assistive tech.

**Control panel:** the settings column is the instrument's faceplate. It has a 2 px Shade enclosure on White with a screw in each corner, and a Shade nameplate ("Controls", model "Sunlight · Mk I") with a square status lamp: Sun when the preview is ready, dark while rendering. Sections are numbered in the order you use them (01 Pick a circumstance, 02 Adjust, 03 How this works) and divided by Shade rules. Segment buttons have a deeper bottom edge for key travel and sink 1 px when on. The strength slider is a fader: a grooved track, a square Sun cap and tick marks every 10%. On wide screens the panel is sticky: it stays in view while the page scrolls, capped at the window's height. The nameplate and a base strip stay fixed and the sections scroll inside.

**Signature elements**

- **Live eye-chart hero:** the headline set as a Snellen chart, lines shrinking, acuity (20/200 … 20/20) in the margin, with a duochrome (red/green) test bar. The headline tours every condition on its own, two seconds each, using the same model as the pixel code (as SVG filters). The only control is a Pause tour button (WCAG 2.2.2), beside one quiet line saying what is showing. Directly under the chart, the line "Designers check their work at a desk in perfect light. Your users don't." explains the headline, then a shorter muted line leads to the upload. It pauses off-screen, stays quiet for screen readers while touring, and never starts on its own under reduced motion. The duochrome colours are content, like a screenshot, not part of the interface palette.
- **Trust marks:** ● Measured, ◐ Modelled, ○ Illustrative, always with the word.
- **Tone strip:** eleven greys, L* 0–100, run through the current condition, with merged steps hatched in Signal.
- **Readouts:** each side of the comparison states what it shows in real units.

**Motion:** one idea only, the shutter wipe: changing condition wipes it in from one side, in the hero tour and in the comparison. No wipes under reduced motion.

**Voice in the UI:** one plain fact first, then at most one dry line. The joke never replaces the fact.

**Avoid:** cream or tinted backgrounds, soft cards, shadows, pill buttons, pastel badges, italic accent phrases, yellow text.

## One-week scope

**MVP:**

- [ ] Screenshot upload
- [ ] About eight conditions: sunlight with measured contrast, dim room, blur, two or three colour-blindness types, cracked screen, budget display
- [ ] Before-and-after slider
- [ ] Glance test
- [ ] Three scenarios
- [ ] Shareable comparison images
- [ ] Honesty labels on every condition

**Later:** tremor tap, thumb reach, "what disappeared" overlay, stakeholder summary, live-URL mode, a Figma plugin.

**Plan:**

1. **Day 1:** Talk to 5 or 6 designers and developers about how they check designs today. Settle the contrast model and R values.
2. **Day 2:** Flows, visual direction, scenario wording.
3. **Days 3–4:** Build the filters, contrast maths, and slider.
4. **Day 5:** Glance test, scenarios, share images.
5. **Day 6:** Test with designers on their own screens; fix.
6. **Day 7:** Ship and write the case study.

## Risks and resume line

**Risks:**

- The contrast model is only as credible as its R values. Source them and show the working.
- Simulations like colour blindness are approximations. The honesty labels must say so.
- Its audience is designers, so it's less of a mass-market story than Kept.

**Resume line:**

> Designed and shipped Sunlight, a tool that shows designers how their interfaces hold up in real-world conditions, including measured outdoor contrast loss.
