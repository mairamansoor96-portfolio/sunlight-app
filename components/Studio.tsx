"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ConditionPicker } from "./ConditionPicker";
import { PixelCanvas } from "./PixelCanvas";
import { ToneStrip } from "./ToneStrip";
import { TrustTag } from "./TrustMark";
import { UploadZone } from "./UploadZone";
import { ImageLoadError, loadImageFile } from "@/lib/loadImage";
import { CONDITIONS, HONESTY, applyConditions, getCondition, type PixelBuffer } from "@/lib/simulations";
import { downscale } from "@/lib/thumbnail";

const DEFAULT_STRENGTHS = Object.fromEntries(CONDITIONS.map((c) => [c.id, c.strength.default]));
/** Wait for the strength slider to settle before re-rendering a large image. */
const RENDER_DEBOUNCE_MS = 120;
/** Thumbnail width in device pixels (shown at 40 CSS px). */
const THUMB_WIDTH = 80;

export function Studio() {
  const strengthId = useId();
  const [source, setSource] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conditionId, setConditionId] = useState(CONDITIONS[0].id);
  const [strengths, setStrengths] = useState<Record<string, number>>(DEFAULT_STRENGTHS);
  const [result, setResult] = useState<{ image: PixelBuffer; key: string; conditionId: string } | null>(null);

  const condition = getCondition(conditionId);
  const strength = strengths[conditionId];
  const stack = useMemo(() => [{ id: conditionId, strength }], [conditionId, strength]);
  const renderKey = source ? `${fileName}|${conditionId}|${strength}` : "";
  const busy = source !== null && result?.key !== renderKey;

  const small = useMemo(() => (source ? downscale(source, THUMB_WIDTH) : null), [source]);
  const thumbs = useMemo(
    () =>
      small ? Object.fromEntries(CONDITIONS.map((c) => [c.id, c.apply(small, strengths[c.id])])) : {},
    [small, strengths],
  );

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
      const image = applyConditions(source, stack);
      if (!cancelled) setResult({ image, key: renderKey, conditionId: stack[0].id });
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, stack, renderKey]);

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
              left={{ label: "Your monitor", reading: "As designed" }}
              right={{ label: condition.name, reading: condition.reading(strength) }}
              wipeKey={result?.conditionId}
              before={<PixelCanvas image={source} label="Your screenshot, as uploaded" />}
              after={
                <PixelCanvas
                  image={result?.image ?? source}
                  label={`Your screenshot with ${condition.name} simulated`}
                />
              }
            />
            <p className="stage__status reading" role="status">
              {busy ? "Going outside…" : "Drag the divider, or focus it and use the arrow keys."}
            </p>
            <ToneStrip stack={stack} conditionName={condition.name} />
          </section>

          <section className="studio__controls" aria-labelledby="controls-heading">
            <h2 id="controls-heading" className="controls__title">
              Pick a circumstance
            </h2>
            <ConditionPicker selected={conditionId} onSelect={setConditionId} thumbs={thumbs} />

            <div className="strength">
              <div className="strength__top">
                <label htmlFor={strengthId} className="strength__label">
                  {condition.strength.label}
                </label>
                <output htmlFor={strengthId} className="reading">
                  {Math.round(strength * 100)}%
                </output>
              </div>
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
              <TrustTag honesty={condition.honesty} />
              <p className="method__meaning">{HONESTY[condition.honesty].meaning}</p>
              <p className="method__body">{condition.method}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
