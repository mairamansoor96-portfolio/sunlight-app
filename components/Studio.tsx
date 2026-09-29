"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ConditionControls } from "./ConditionControls";
import { ConditionPicker } from "./ConditionPicker";
import { ContrastReport } from "./ContrastReport";
import { PixelCanvas } from "./PixelCanvas";
import { ToneStrip } from "./ToneStrip";
import { TrustTag } from "./TrustMark";
import { UploadZone } from "./UploadZone";
import { ImageLoadError, loadImageFile } from "@/lib/loadImage";
import { findPairs, type RGB } from "@/lib/contrastPairs";
import {
  CONDITIONS,
  HONESTY,
  applyConditions,
  getCondition,
  paramsWithDefaults,
  type Params,
  type PixelBuffer,
} from "@/lib/simulations";
import { sunlightSettings } from "@/lib/simulations/sunlight";
import { downscale } from "@/lib/thumbnail";

const DEFAULT_STRENGTHS = Object.fromEntries(CONDITIONS.map((c) => [c.id, c.strength.default]));
const DEFAULT_PARAMS: Record<string, Params> = Object.fromEntries(CONDITIONS.map((c) => [c.id, paramsWithDefaults(c)]));

type PickStep = null | "text" | "background";
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
  const [paramsById, setParamsById] = useState<Record<string, Params>>(DEFAULT_PARAMS);
  const [result, setResult] = useState<{ image: PixelBuffer; key: string; conditionId: string } | null>(null);
  const [customPair, setCustomPair] = useState<{ text: RGB; background: RGB } | null>(null);
  const [pickStep, setPickStep] = useState<PickStep>(null);
  const [pickedText, setPickedText] = useState<RGB | null>(null);

  const condition = getCondition(conditionId);
  const hasControls = Boolean(condition.controls?.length);
  // Conditions with preset controls always run at full strength.
  const strength = hasControls ? 1 : strengths[conditionId];
  const params = paramsById[conditionId];
  const stack = useMemo(() => [{ id: conditionId, strength, params }], [conditionId, strength, params]);
  const renderKey = source ? `${fileName}|${conditionId}|${strength}|${JSON.stringify(params)}` : "";
  const busy = source !== null && result?.key !== renderKey;

  const small = useMemo(() => (source ? downscale(source, THUMB_WIDTH) : null), [source]);
  const thumbs = useMemo(
    () =>
      small
        ? Object.fromEntries(
            CONDITIONS.map((c) => [c.id, c.apply(small, c.controls?.length ? 1 : strengths[c.id], paramsById[c.id])]),
          )
        : {},
    [small, strengths, paramsById],
  );
  const pairs = useMemo(() => (source ? findPairs(source) : []), [source]);

  const onPick = useCallback(
    (fx: number, fy: number) => {
      if (!source || !pickStep) return;
      const x = Math.min(source.width - 1, Math.floor(fx * source.width));
      const y = Math.min(source.height - 1, Math.floor(fy * source.height));
      const o = (y * source.width + x) * 4;
      const colour: RGB = [source.data[o], source.data[o + 1], source.data[o + 2]];
      if (pickStep === "text") {
        setPickedText(colour);
        setPickStep("background");
      } else {
        setCustomPair({ text: pickedText ?? colour, background: colour });
        setPickStep(null);
      }
    },
    [source, pickStep, pickedText],
  );

  useEffect(() => {
    if (!pickStep) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPickStep(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickStep]);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const img = await loadImageFile(file);
      setResult(null);
      setCustomPair(null);
      setPickStep(null);
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
              right={{ label: condition.name, reading: condition.reading(strength, params) }}
              wipeKey={result?.conditionId}
              picking={pickStep !== null}
              onPick={onPick}
              before={<PixelCanvas image={source} label="Your screenshot, as uploaded" />}
              after={
                <PixelCanvas
                  image={result?.image ?? source}
                  label={`Your screenshot with ${condition.name} simulated`}
                />
              }
            />
            <p className="stage__status reading" role="status">
              {pickStep === "text"
                ? "Tap the text colour in the screenshot. Esc cancels."
                : pickStep === "background"
                  ? "Now tap the background behind it."
                  : busy
                    ? "Going outside…"
                    : "Drag the divider, or focus it and use the arrow keys."}
            </p>
            {conditionId === "sunlight" && (
              <ContrastReport
                pairs={pairs}
                custom={customPair}
                onCustomChange={setCustomPair}
                {...sunlightSettings(params)}
                picking={pickStep !== null}
                onPick={() => setPickStep((step) => (step ? null : "text"))}
              />
            )}
            <ToneStrip stack={stack} conditionName={condition.name} />
          </section>

          <section className="studio__controls" aria-labelledby="controls-heading">
            <h2 id="controls-heading" className="controls__title">
              Pick a circumstance
            </h2>
            <ConditionPicker selected={conditionId} onSelect={setConditionId} thumbs={thumbs} />

            {hasControls ? (
              <ConditionControls
                condition={condition}
                params={params}
                onChange={(next) => setParamsById((all) => ({ ...all, [conditionId]: next }))}
              />
            ) : (
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
            )}

            <div className="method">
              <TrustTag honesty={condition.honesty} />
              <p className="method__meaning">{HONESTY[condition.honesty].meaning}</p>
              <p className="method__body">{condition.method}</p>
              {condition.assumptions && (
                <p className="method__assumptions reading">Assumes {condition.assumptions(strength, params)}.</p>
              )}
              {condition.sources && (
                <details className="method__sources">
                  <summary>Sources</summary>
                  <ul>
                    {condition.sources.map((src) => (
                      <li key={src.url}>
                        <a href={src.url} target="_blank" rel="noreferrer">
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
