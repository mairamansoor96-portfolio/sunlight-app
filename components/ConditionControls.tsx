"use client";

import { useId } from "react";
import type { Condition, Params } from "@/lib/simulations";

interface Props {
  condition: Condition;
  params: Params;
  onChange: (params: Params) => void;
}

/** Preset controls (for example light × phone) as square segments; the real radio covers each one. */
export function ConditionControls({ condition, params, onChange }: Props) {
  const uid = useId();
  return (
    <div className="presets">
      {condition.controls?.map((control) => (
        <fieldset key={control.id} className="presets__group">
          <legend className="label">{control.label}</legend>
          <div className="segments">
            {control.options.map((option) => {
              const on = params[control.id] === option.id;
              return (
                <label key={option.id} className={`segment${on ? " is-on" : ""}`}>
                  <input
                    type="radio"
                    className="segment__input"
                    name={`${uid}-${control.id}`}
                    value={option.id}
                    checked={on}
                    onChange={() => onChange({ ...params, [control.id]: option.id })}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
