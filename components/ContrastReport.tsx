"use client";

import { useId, useState } from "react";
import { describePair } from "@/lib/colourNames";
import { fromHex, luminance, toHex, type ColourPair, type RGB } from "@/lib/contrastPairs";
import {
  LIGHTS,
  PHONES,
  assumptions,
  outdoorContrast,
  reflectedR,
  type LightId,
  type PhoneId,
} from "@/lib/simulations/sunlight";

/** SPEC.md → Sunlight model → Thresholds. */
const PASS = 4.5;
/** Rows shown before "Show all". The summary always counts every combination. */
const SHOWN = 6;

const LIGHT_PHRASE: Record<LightId, string> = {
  overcast: "On an overcast day",
  shade: "In open shade",
  sun: "In direct sun",
};

const score = (r: number) => r.toFixed(2);

type Row = { text: RGB; background: RGB; own: boolean; pair?: ColourPair };

interface Props {
  pairs: ColourPair[];
  custom: { text: RGB; background: RGB } | null;
  onCustomChange: (pair: { text: RGB; background: RGB }) => void;
  light: LightId;
  phone: PhoneId;
  picking: boolean;
  onPick: () => void;
  /** The combination whose location is pinned on the screenshot, if any. */
  shown: ColourPair | null;
  /** Hover or focus previews a location; null clears the preview. */
  onPreview: (pair: ColourPair | null) => void;
  /** Pins (or unpins, with null) a location on the screenshot. */
  onShow: (pair: ColourPair | null) => void;
}

/**
 * "Can people still read it outside?" Measured contrast for the text colours a
 * screenshot really uses, indoors and under each light for the chosen phone
 * (SPEC.md → Sunlight model → Report).
 */
export function ContrastReport({
  pairs,
  custom,
  onCustomChange,
  light,
  phone,
  picking,
  onPick,
  shown,
  onPreview,
  onShow,
}: Props) {
  const textId = useId();
  const bgId = useId();
  const [showAll, setShowAll] = useState(false);
  const rows: Row[] = [
    ...(custom ? [{ ...custom, own: true }] : []),
    ...pairs.map((p) => ({ text: p.text, background: p.background, own: false, pair: p })),
  ];
  // The chosen light comes first after Indoors, so it stays visible on a phone.
  const lights = [light, ...(Object.keys(LIGHTS) as LightId[]).filter((l) => l !== light)];

  const contrastUnder = (row: { text: RGB; background: RGB }, l: LightId | null) =>
    outdoorContrast(luminance(row.text), luminance(row.background), l ? reflectedR(l, phone) : 0);

  const indoorPass = rows.filter((r) => contrastUnder(r, null) >= PASS).length;
  const outdoorPass = rows.filter((r) => contrastUnder(r, light) >= PASS).length;
  const phoneLabel = PHONES[phone].label.toLowerCase();
  const hardest = rows.reduce<Row | null>(
    (w, r) => (!w || contrastUnder(r, light) < contrastUnder(w, light) ? r : w),
    null,
  );

  const outdoorPhrase =
    outdoorPass === 0 ? "none are" : outdoorPass === rows.length ? "they all still are" : `only ${outdoorPass} are`;
  const lightLower = LIGHT_PHRASE[light].replace(/^./, (c) => c.toLowerCase());

  const current = custom ?? { text: [118, 118, 118] as RGB, background: [255, 255, 255] as RGB };

  // A render function, not a component: a nested component would remount on every
  // render and drop keyboard focus.
  const showWhere = (pair: ColourPair) => {
    if (pair.where.cells.length === 0) return null;
    const on = shown === pair;
    return (
      <button
        type="button"
        className="show-where"
        aria-pressed={on}
        onClick={() => onShow(on ? null : pair)}
        onFocus={() => onPreview(pair)}
        onBlur={() => onPreview(null)}
      >
        {on ? "Hide" : "Show where"}
      </button>
    );
  };

  return (
    <section className="report" aria-labelledby="report-title">
      <div className="report__head">
        <h3 id="report-title" className="report__title">
          Can people still read it outside?
        </h3>
        <p className="report__explain">
          Each row is a text colour on its background, found in your screenshot. The score is how much the text
          stands out: <strong>4.5 or higher is readable</strong>, lower is hard work. Outdoors, light reflecting off
          the screen pulls every score down.
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="report__summary" aria-live="polite">
          <p>
            <strong>
              {indoorPass} of {rows.length} text colour combinations are readable indoors. {LIGHT_PHRASE[light]} on
              a {phoneLabel}, {outdoorPhrase}.
            </strong>
          </p>
          {hardest && (
            <p className="report__hardest">
              Hardest to read: {describePair(hardest.text, hardest.background).toLowerCase()}, scoring{" "}
              {score(contrastUnder(hardest, null))} indoors and {score(contrastUnder(hardest, light))} {lightLower}.{" "}
              {hardest.pair && showWhere(hardest.pair)}
            </p>
          )}
        </div>
      ) : (
        <p className="report__summary">
          No clear text colours found. Test a specific bit of text below instead.
        </p>
      )}

      {rows.length > 0 && (
        <div className="report__scroll">
          <table className="report__table">
            <caption className="visually-hidden">
              Contrast score of each text colour combination indoors and under each light, on a {phoneLabel}. 4.5 or
              higher is readable.
            </caption>
            <thead>
              <tr>
                <th scope="col">Text on background</th>
                <th scope="col">Indoors</th>
                {lights.map((l) => (
                  <th key={l} scope="col" className={l === light ? "is-on" : undefined}>
                    {LIGHTS[l].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(showAll ? rows : rows.slice(0, SHOWN)).map((row, i) => (
                <tr
                  key={`${toHex(row.text)}-${toHex(row.background)}-${i}`}
                  className={row.pair && shown === row.pair ? "is-shown" : undefined}
                  onMouseEnter={() => row.pair && onPreview(row.pair)}
                  onMouseLeave={() => onPreview(null)}
                >
                  <th scope="row">
                    <span className="pair">
                      <span
                        className="pair__swatch"
                        style={{ color: toHex(row.text), backgroundColor: toHex(row.background) }}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                      <span className="pair__words">
                        {row.own && <span className="pair__own">Your text</span>}
                        <span className="pair__name">{describePair(row.text, row.background)}</span>
                        <span className="pair__hex">
                          {toHex(row.text)} on {toHex(row.background)}
                        </span>
                        {row.pair && showWhere(row.pair)}
                      </span>
                    </span>
                  </th>
                  {[null, ...lights].map((l) => {
                    const c = contrastUnder(row, l);
                    const pass = c >= PASS;
                    return (
                      <td key={l ?? "indoors"} className={l === light ? "is-on" : undefined}>
                        <span className="score">{score(c)}</span>
                        <span className={`verdict${pass ? "" : " verdict--fail"}`}>{pass ? "Readable" : "Too faint"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > SHOWN && (
        <button type="button" className="btn btn--line report__more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? `Show the ${SHOWN} hardest to read` : `Show all ${rows.length} combinations`}
        </button>
      )}

      <fieldset className="own-pair">
        <legend className="own-pair__title">Test a specific bit of text</legend>
        <p className="own-pair__help">
          Tap <strong>Pick from screenshot</strong>, then tap the text, then the background behind it. Or set the two
          colours here.
        </p>
        <div className="own-pair__row">
          <button type="button" className="btn btn--line" onClick={onPick} aria-pressed={picking}>
            {picking ? "Cancel picking" : "Pick from screenshot"}
          </button>
          <label htmlFor={textId} className="own-pair__field">
            <input
              id={textId}
              type="color"
              value={toHex(current.text).toLowerCase()}
              onChange={(e) => {
                const text = fromHex(e.target.value);
                if (text) onCustomChange({ text, background: current.background });
              }}
            />
            Text
          </label>
          <label htmlFor={bgId} className="own-pair__field">
            <input
              id={bgId}
              type="color"
              value={toHex(current.background).toLowerCase()}
              onChange={(e) => {
                const background = fromHex(e.target.value);
                if (background) onCustomChange({ text: current.text, background });
              }}
            />
            Background
          </label>
        </div>
      </fieldset>

      <p className="reading report__assumptions">Assumes {assumptions({ light, phone })}.</p>
      <p className="report__note">
        Scores are WCAG contrast ratios: 4.5 means 4.5:1, the AA line for body text. Large text (24 px, or 18.66 px
        bold) and icons only need 3.
      </p>
    </section>
  );
}
