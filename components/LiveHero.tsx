"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TrustTag } from "./TrustMark";
import { CONDITIONS, type Condition, type FilterStep } from "@/lib/simulations";

/** The headline set as an eye chart: each line smaller, Snellen acuity in the margin. */
const LINES = [
  { text: "Looks", acuity: "20/200" },
  { text: "great on", acuity: "20/100" },
  { text: "your monitor", acuity: "20/50" },
  { text: "Let’s go outside", acuity: "20/20" },
];

const MONITOR = "monitor";
/** The hero shows every condition at full strength. */
const HERO_STRENGTH = 1;
/** Played once, a moment after load, unless the visitor has already chosen or prefers reduced motion. */
const AUTOPLAY = { id: "blurred-vision", delayMs: 1800 };
const WIPE_MS = 700;

const HERO_CONDITIONS = CONDITIONS.filter((c) => c.filter);
const shortName = (c: Condition) => c.name.split(/[,(]/)[0].trim();
const stepsFor = (id: string): FilterStep[] =>
  id === MONITOR ? [] : (HERO_CONDITIONS.find((c) => c.id === id)?.filter?.(HERO_STRENGTH) ?? []);

/** What to look for, derived from what the model does rather than hand-written per condition. */
function noteFor(steps: FilterStep[]): string {
  if (steps.some((s) => s.kind === "blur")) return "Big letters survive. The 20/20 line goes first.";
  if (steps.every((s) => s.kind === "matrix")) return "Black and grey pass through unchanged. Watch the duochrome bar.";
  return "The paper sinks to grey and the duochrome nearly goes black. Contrast is what’s left.";
}

/** The same model as the pixel code, as SVG filter primitives. */
function Primitives({ steps }: { steps: FilterStep[] }) {
  return steps.map((step, i) => {
    switch (step.kind) {
      case "blur":
        return <feGaussianBlur key={i} stdDeviation={step.sigmaPt} colorInterpolationFilters="linearRGB" />;
      case "table": {
        const values = step.values.map((v) => v.toFixed(4)).join(" ");
        return (
          <feComponentTransfer key={i} colorInterpolationFilters="sRGB">
            <feFuncR type="table" tableValues={values} />
            <feFuncG type="table" tableValues={values} />
            <feFuncB type="table" tableValues={values} />
          </feComponentTransfer>
        );
      }
      case "matrix": {
        const m = step.values;
        const values = `${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0`;
        return <feColorMatrix key={i} type="matrix" values={values} colorInterpolationFilters="linearRGB" />;
      }
    }
  });
}

function Chart({ filterId }: { filterId?: string }) {
  return (
    <div className="chart" style={filterId ? { filter: `url(#${filterId})` } : undefined}>
      {LINES.map((line, i) => (
        <span key={line.acuity} className={`chart__line chart__line--${i + 1}`}>
          <span className="chart__text">{line.text}</span>
          <span className="chart__acuity">{line.acuity}</span>
        </span>
      ))}
      <span className="chart__line chart__line--duo">
        <span className="duo">
          <span className="duo__half duo__half--red">ZHC</span>
          <span className="duo__half duo__half--green">OSN</span>
        </span>
        <span className="chart__acuity">Duochrome</span>
      </span>
    </div>
  );
}

/**
 * The headline, run through Sunlight's own conditions. The first thing a visitor
 * sees is the product working on its own words.
 */
export function LiveHero() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [active, setActive] = useState(MONITOR);
  const [previous, setPrevious] = useState(MONITOR);
  const touched = useRef(false);
  const overlay = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const choose = (id: string) => {
    setPrevious(active);
    setActive(id);
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (!touched.current) {
        setPrevious(MONITOR);
        setActive(AUTOPLAY.id);
      }
    }, AUTOPLAY.delayMs);
    return () => window.clearTimeout(timer);
  }, []);

  // The new condition wipes across from the left, over the previous one.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    overlay.current?.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
      duration: WIPE_MS,
      easing: "cubic-bezier(0.6, 0, 0.2, 1)",
    });
  }, [active]);

  const activeSteps = stepsFor(active);
  const previousSteps = stepsFor(previous);
  const condition = HERO_CONDITIONS.find((c) => c.id === active);
  const activeFilter = `${uid}-active`;
  const previousFilter = `${uid}-previous`;

  return (
    <div className="live-hero">
      <h1 className="visually-hidden">Looks great on your monitor. Let&rsquo;s go outside.</h1>

      <svg className="live-hero__defs" aria-hidden="true" focusable="false">
        <filter id={activeFilter} x="-2%" y="-2%" width="104%" height="104%">
          <Primitives steps={activeSteps} />
        </filter>
        <filter id={previousFilter} x="-2%" y="-2%" width="104%" height="104%">
          <Primitives steps={previousSteps} />
        </filter>
      </svg>

      <div className="live-hero__stage" aria-hidden="true">
        <div className="live-hero__layer">
          <Chart filterId={previousSteps.length ? previousFilter : undefined} />
        </div>
        <div ref={overlay} className="live-hero__layer" data-testid="hero-overlay" data-condition={active}>
          <Chart filterId={activeSteps.length ? activeFilter : undefined} />
        </div>
      </div>

      <div className="live-hero__controls">
        <fieldset className="lens">
          <legend className="label">See this headline</legend>
          <div className="lens__options">
            {[{ id: MONITOR, label: "Your monitor" }, ...HERO_CONDITIONS.map((c) => ({ id: c.id, label: shortName(c) }))].map(
              (o) => (
                <label key={o.id} className={`lens__option${o.id === active ? " is-on" : ""}`}>
                  <input
                    type="radio"
                    name={`${uid}-lens`}
                    value={o.id}
                    checked={o.id === active}
                    onChange={() => {
                      touched.current = true;
                      choose(o.id);
                    }}
                    className="lens__input"
                  />
                  {o.label}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <p className="live-hero__readout" aria-live="polite">
          {condition ? (
            <>
              <span className="reading">
                {condition.name} · {condition.reading(HERO_STRENGTH)}
              </span>
              <TrustTag honesty={condition.honesty} />
              <span className="live-hero__note">{noteFor(activeSteps)}</span>
            </>
          ) : (
            <span className="reading">Your monitor · As designed, in perfect light</span>
          )}
        </p>
      </div>
    </div>
  );
}
