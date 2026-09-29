"use client";

import { useId } from "react";
import { CONDITIONS, FAMILIES, HONESTY, type Condition } from "@/lib/simulations";

export function HonestyBadge({ honesty }: { honesty: Condition["honesty"] }) {
  return (
    <span className={`badge badge--${honesty}`} title={HONESTY[honesty].meaning}>
      {HONESTY[honesty].name}
    </span>
  );
}

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

/** Conditions grouped by family (SPEC.md → Conditions library). */
export function ConditionPicker({ selected, onSelect }: Props) {
  const name = useId();
  const families = FAMILIES.map((f) => ({ ...f, items: CONDITIONS.filter((c) => c.family === f.id) })).filter(
    (f) => f.items.length > 0,
  );

  return (
    <div className="picker">
      {families.map((family) => (
        <fieldset key={family.id} className="picker__family">
          <legend className="picker__legend">{family.name}</legend>
          {family.items.map((c) => (
            <label key={c.id} className={`option${c.id === selected ? " option--selected" : ""}`}>
              <input
                type="radio"
                name={name}
                value={c.id}
                checked={c.id === selected}
                onChange={() => onSelect(c.id)}
                className="option__radio"
              />
              <span className="option__body">
                <span className="option__head">
                  <span className="option__name">{c.name}</span>
                  <HonestyBadge honesty={c.honesty} />
                </span>
                <span className="option__blurb">{c.blurb}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
