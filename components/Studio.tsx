"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ConditionPicker, HonestyBadge } from "./ConditionPicker";
import { PixelCanvas } from "./PixelCanvas";
import { UploadZone } from "./UploadZone";
import { ImageLoadError, loadImageFile } from "@/lib/loadImage";
import { CONDITIONS, HONESTY, applyConditions, getCondition } from "@/lib/simulations";

const DEFAULT_STRENGTHS = Object.fromEntries(CONDITIONS.map((c) => [c.id, c.strength.default]));
/** Wait for the strength slider to settle before re-rendering a large image. */
const RENDER_DEBOUNCE_MS = 120;

export function Studio() {
  const strengthId = useId();
  const [source, setSource] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conditionId, setConditionId] = useState(CONDITIONS[0].id);
  const [strengths, setStrengths] = useState<Record<string, number>>(DEFAULT_STRENGTHS);
  const [result, setResult] = useState<{ image: ImageData; key: string } | null>(null);

  const condition = getCondition(conditionId);
  const strength = strengths[conditionId];
  const renderKey = source ? `${fileName}|${conditionId}|${strength}` : "";
  const busy = source !== null && result?.key !== renderKey;

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const img = await loadImageFile(file);
      setResult(null);
      setSource(img);
      setFileName(`${file.name}#${Date.now()}`);
    } catch (e) {
      setError(e instanceof ImageLoadError ? e.message : "Something went wrong opening that image. Try another one.");
    }
  }, []);

  const onSample = useCallback(async () => {
    try {
      const res = await fetch("sample-screenshot.png");
      const blob = await res.blob();
      await onFile(new File([blob], "sample-screenshot.png", { type: "image/png" }));
    } catch {
      setError("Couldn't load the sample. Try your own screenshot instead.");
    }
  }, [onFile]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const out = applyConditions(source, [{ id: conditionId, strength }]);
      if (!cancelled) setResult({ image: new ImageData(out.data as ImageDataArray, out.width, out.height), key: renderKey });
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, conditionId, strength, renderKey]);

  return (
    <div className="studio">
      <UploadZone onFile={onFile} onSample={onSample} error={error} compact={source !== null} />

      {source && (
        <div className="studio__workspace">
          <section className="studio__stage" aria-labelledby="stage-heading" aria-busy={busy}>
            <h2 id="stage-heading" className="visually-hidden">
              Before and after
            </h2>
            <BeforeAfterSlider
              beforeLabel="Your monitor"
              afterLabel={condition.name}
              before={<PixelCanvas image={source} label="Your screenshot, as uploaded" />}
              after={
                <PixelCanvas
                  image={result?.image ?? source}
                  label={`Your screenshot with ${condition.name} simulated`}
                />
              }
            />
            <p className="stage__status" role="status">
              {busy ? "Going outside…" : "Drag the divider, or focus it and use the arrow keys."}
            </p>
          </section>
          <section className="studio__controls" aria-labelledby="controls-heading">
            <h2 id="controls-heading" className="section-title">
              Pick a circumstance
            </h2>
            <ConditionPicker selected={conditionId} onSelect={setConditionId} />

            <div className="strength">
              <label htmlFor={strengthId} className="strength__label">
                {condition.strength.label}
                <output htmlFor={strengthId} className="strength__value">
                  {Math.round(strength * 100)}%
                </output>
              </label>
              <input
                id={strengthId}
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(strength * 100)}
                onChange={(e) => setStrengths((s) => ({ ...s, [conditionId]: Number(e.target.value) / 100 }))}
              />
            </div>

            <div className="method">
              <p className="method__head">
                <HonestyBadge honesty={condition.honesty} /> <span>{HONESTY[condition.honesty].meaning}</span>
              </p>
              <p className="method__body">{condition.method}</p>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
