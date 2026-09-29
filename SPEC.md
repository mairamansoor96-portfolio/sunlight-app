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
| Body | Colour blindness (2–3 types) | Modelled | Yes |
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

**Open question:** choose defensible R values for each preset from published display-reflectance and outdoor-illuminance figures, and cite them in the product.

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
