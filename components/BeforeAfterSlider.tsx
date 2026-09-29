"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

interface Props {
  before: ReactNode;
  after: ReactNode;
  beforeLabel: string;
  afterLabel: string;
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Wipe between the original (left) and the simulated condition (right).
 * Drag anywhere on the image, or focus the handle and use the arrow keys.
 */
export function BeforeAfterSlider({ before, after, beforeLabel, afterLabel }: Props) {
  const [pos, setPos] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

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
      <div className="compare__tags" aria-hidden="true">
        <span className="compare__tag">← {beforeLabel}</span>
        <span className="compare__tag compare__tag--after">{afterLabel} →</span>
      </div>
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
        <div className="compare__layer compare__layer--after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          {after}
        </div>
        <div className="compare__divider" style={{ left: `${pos}%` }}>
          <div
            className="compare__handle"
            role="slider"
            tabIndex={0}
            aria-label={`Comparison: ${beforeLabel} on the left, ${afterLabel} on the right`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={shown}
            aria-valuetext={`${shown}% ${beforeLabel}, ${100 - shown}% ${afterLabel}`}
            onKeyDown={onKeyDown}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
