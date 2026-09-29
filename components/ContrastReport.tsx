"use client";

import { useId, useState } from "react";
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
/** Rows shown before "Show all". The summary always counts every pair. */
const SHOWN = 6;

const LIGHT_PHRASE: Record<LightId, string> = {
  overcast: "On an overcast day",
  shade: "In open shade",
  sun: "In direct sun",
};

const ratio = (r: number) => `${r.toFixed(2)}:1`;

interface Props {
  pairs: ColourPair[];
  custom: { text: RGB; background: RGB } | null;
  onCustomChange: (pair: { text: RGB; background: RGB }) => void;
  light: LightId;
  phone: PhoneId;
  picking: boolean;
  onPick: () => void;
}

/**
 * Measured contrast for the screenshot's real colour pairs, indoors and under
 * each light preset for the chosen phone (SPEC.md → Sunlight model → Report).
 */
export function ContrastReport({ pairs, custom, onCustomChange, light, phone, picking, onPick }: Props) {
  const textId = useId();
  const bgId = useId();
  const [showAll, setShowAll] = useState(false);
  const rows = [...(custom ? [{ ...custom, own: true }] : []), ...pairs.map((p) => ({ ...p, own: false }))];
  // The chosen light comes first after Indoors, so it stays visible on a phone.
  const lights = [light, ...(Object.keys(LIGHTS) as LightId[]).filter((l) => l !== light)];

  const contrastUnder = (row: { text: RGB; background: RGB }, l: LightId | null) =>
    outdoorContrast(luminance(row.text), luminance(row.background), l ? reflectedR(l, phone) : 0);

  const indoorPass = rows.filter((r) => contrastUnder(r, null) >= PASS).length;
  const outdoorPass = rows.filter((r) => contrastUnder(r, light) >= PASS).length;
  const phoneLabel = PHONES[phone].label.toLowerCase();
  const weakest = rows.reduce<(typeof rows)[number] | null>(
    (w, r) => (!w || contrastUnder(r, light) < contrastUnder(w, light) ? r : w),
    null,
  );

  const outdoorPhrase =
    outdoorPass === 0 ? "none do" : outdoorPass === rows.length ? "they all still do" : `${outdoorPass} do`;

  const current = custom ?? { text: [118, 118, 118] as RGB, background: [255, 255, 255] as RGB };

  return (
    <section className="report" aria-labelledby="report-title">
      <h3 id="report-title" className="label">
        Contrast outdoors · measured from your colours
      </h3>

      {rows.length > 0 ? (
        <p className="report__summary" aria-live="polite">
          <strong>
            {indoorPass} of {rows.length} colour pairs pass indoors. {LIGHT_PHRASE[light]} on a {phoneLabel},{" "}
            {outdoorPhrase}.
          </strong>{" "}
          {weakest && (
            <>
              Weakest: {toHex(weakest.text)} on {toHex(weakest.background)}, {ratio(contrastUnder(weakest, null))}{" "}
              indoors and {ratio(contrastUnder(weakest, light))} {LIGHT_PHRASE[light].replace(/^./, (c) => c.toLowerCase())}.
            </>
          )}
        </p>
      ) : (
        <p className="report__summary">
          No clear text-and-background pairs found. Pick a pair from the screenshot, or type the colours below.
        </p>
      )}

      {rows.length > 0 && (
        <div className="report__scroll">
          <table className="report__table">
            <caption className="visually-hidden">
              Contrast of each colour pair indoors and under each light, on a {phoneLabel}. Pass is {PASS}:1.
            </caption>
            <thead>
              <tr>
                <th scope="col">Pair</th>
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
                <tr key={`${toHex(row.text)}-${toHex(row.background)}-${i}`}>
                  <th scope="row">
                    <span className="pair">
                      <span
                        className="pair__swatch"
                        style={{ color: toHex(row.text), backgroundColor: toHex(row.background) }}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                      <span className="pair__hex">
                        {row.own && <span className="pair__own">Your pair</span>}
                        {toHex(row.text)} on {toHex(row.background)}
                      </span>
                    </span>
                  </th>
                  {[null, ...lights].map((l) => {
                    const c = contrastUnder(row, l);
                    const pass = c >= PASS;
                    return (
                      <td key={l ?? "indoors"} className={l === light ? "is-on" : undefined}>
                        <span className="ratio">{ratio(c)}</span>
                        <span className={`verdict${pass ? "" : " verdict--fail"}`}>{pass ? "Pass" : "Fail"}</span>
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
          {showAll ? `Show the ${SHOWN} weakest` : `Show all ${rows.length} pairs`}
        </button>
      )}

      <fieldset className="own-pair">
        <legend className="label">Check your own pair</legend>
        <div className="own-pair__row">
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
          <button type="button" className="btn btn--line" onClick={onPick} aria-pressed={picking}>
            {picking ? "Cancel picking" : "Pick from screenshot"}
          </button>
        </div>
      </fieldset>

      <p className="reading report__assumptions">Assumes {assumptions({ light, phone })}.</p>
      <p className="report__note">
        Pass means {PASS}:1, the WCAG AA line for body text. Large text (24 px, or 18.66 px bold) and interface parts
        need 3:1.
      </p>
    </section>
  );
}
