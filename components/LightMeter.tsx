"use client";

import { useHeroCondition } from "@/lib/heroCondition";
import { LANDMARKS, ambientFor, formatLux, meterPosition } from "@/lib/lightLevels";

/** Decade ticks on the log scale. */
const DECADES = [1, 10, 100, 1_000, 10_000, 100_000];
const short = (lux: number) => (lux >= 1000 ? `${lux / 1000}k` : String(lux));

/**
 * The header's light meter: where the hero's current condition sits on a log
 * scale of real light levels. It mirrors the hero, so it's hidden from
 * assistive tech; the hero's own readout carries the information.
 */
export function LightMeter() {
  const level = ambientFor(useHeroCondition());

  return (
    <div className="meter" aria-hidden="true">
      <p className="meter__readout" data-testid="meter-readout">
        <strong>{formatLux(level.lux)}</strong> · {level.label}
      </p>
      <div className="meter__scale">
        {DECADES.map((d, i) => (
          <span
            key={d}
            className={`meter__tick${i === 0 ? " meter__tick--start" : i === DECADES.length - 1 ? " meter__tick--end" : ""}`}
            style={{ left: `${meterPosition(d)}%` }}
          />
        ))}
        {LANDMARKS.map((l, i) => (
          <span
            key={l.label}
            className={`meter__landmark${i === 0 ? " meter__landmark--start" : i === LANDMARKS.length - 1 ? " meter__landmark--end" : ""}`}
            style={{ left: `${meterPosition(l.lux)}%` }}
          >
            {l.label} · {short(l.lux)}
          </span>
        ))}
        <span className="meter__needle" style={{ left: `${meterPosition(level.lux)}%` }} />
      </div>
    </div>
  );
}
