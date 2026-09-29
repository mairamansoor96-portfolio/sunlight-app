"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

interface Side {
  label: string;
  /** What this side shows, in real units, e.g. "Brightness 40%". */
  reading: string;
}

interface Props {
  before: ReactNode;
  after: ReactNode;
  left: Side;
  right: Side;
  /** When this changes, the processed side wipes in from the right like a shutter. */
  wipeKey?: string;
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Wipe between the original (left) and the simulated condition (right), framed
 * with crop marks like a calibration print. Drag anywhere on the image, or
 * focus the handle and use the arrow keys.
 */
export function BeforeAfterSlider({ before, after, left, right, wipeKey }: Props) {
  const [pos, setPos] = useState(50);
  const posRef = useRef(pos);
  const frame = useRef<HTMLDivElement>(null);
  const afterLayer = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const firstWipe = useRef(true);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    if (firstWipe.current) {
      firstWipe.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    afterLayer.current?.animate(
      [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: `inset(0 0 0 ${posRef.current}%)` }],
      { duration: 320, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
  }, [wipeKey]);

  const moveTo = useCallback((clientX: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(clampPct(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next: Record<string, number> = {
      ArrowLeft: pos - step,
      ArrowDown: pos - step,
      ArrowRight: pos + step,
      ArrowUp: pos + step,
      PageDown: pos - 10,
      PageUp: pos + 10,
      Home: 0,
      End: 100,
    };
    if (e.key in next) {
      e.preventDefault();
      setPos(clampPct(next[e.key]));
    }
  };

  const shown = Math.round(pos);

  return (
    <div className="compare">
      <div className="readouts" aria-hidden="true">
        <div className="readout">
          <span className="reading">← Left</span>
          <strong className="readout__name">{left.label}</strong>
          <span className="reading">{left.reading}</span>
        </div>
        <div className="readout readout--right">
          <span className="reading">Right →</span>
          <strong className="readout__name">{right.label}</strong>
          <span className="reading">{right.reading}</span>
        </div>
      </div>
      <div className="crop">
        <i />
        <i />
        <i />
        <i />
        <div
          ref={frame}
          className="compare__frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          data-testid="compare-frame"
        >
          <div className="compare__layer">{before}</div>
          <div
            ref={afterLayer}
            className="compare__layer compare__layer--after"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            {after}
          </div>
          <div className="compare__divider" style={{ left: `${pos}%` }}>
            <div
              className="compare__handle"
              role="slider"
              tabIndex={0}
              aria-label={`Comparison: ${left.label} on the left, ${right.label} on the right`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={shown}
              aria-valuetext={`${shown}% ${left.label}, ${100 - shown}% ${right.label}`}
              onKeyDown={onKeyDown}
            >
              <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
                <path d="M6 4 1 9l5 5M12 4l5 5-5 5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
