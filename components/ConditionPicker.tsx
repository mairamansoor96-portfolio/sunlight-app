"use client";

import { useId } from "react";
import { PixelCanvas } from "./PixelCanvas";
import { TrustTag } from "./TrustMark";
import { CONDITIONS, FAMILIES, type PixelBuffer } from "@/lib/simulations";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  /** A small preview of the user's screenshot under each condition, keyed by condition id. */
  thumbs: Record<string, PixelBuffer>;
}

/** Conditions grouped by family (SPEC.md → Conditions library), as ruled rows. */
export function ConditionPicker({ selected, onSelect, thumbs }: Props) {
  const name = useId();
  const families = FAMILIES.map((f) => ({ ...f, items: CONDITIONS.filter((c) => c.family === f.id) })).filter(
    (f) => f.items.length > 0,
  );

  return (
    <div className="picker">
      {families.map((family) => (
        <fieldset key={family.id} className="family">
          <legend className="label">{family.name}</legend>
          <div className="family__rows">
            {family.items.map((c) => {
              const on = c.id === selected;
              return (
                <label key={c.id} className={`row${on ? " is-on" : ""}`}>
                  <input
                    type="radio"
                    name={name}
                    value={c.id}
                    checked={on}
                    onChange={() => onSelect(c.id)}
                    className="row__input"
                  />
                  <span className="row__thumb">
                    {thumbs[c.id] && <PixelCanvas image={thumbs[c.id]} className="row__canvas" />}
                  </span>
                  <span className="row__body">
                    <span className="row__name">{c.name}</span>
                    <TrustTag honesty={c.honesty} />
                    {on && <span className="row__blurb">{c.blurb}</span>}
                  </span>
                  <span className="row__check" aria-hidden="true" />
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
