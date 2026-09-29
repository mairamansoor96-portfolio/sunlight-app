"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { PairLocation } from "@/lib/contrastPairs";

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
  /** While true, a tap samples the image instead of moving the divider. */
  picking?: boolean;
  /** Called with the tapped point as fractions of the image's width and height. */
  onPick?: (fx: number, fy: number) => void;
  /** Dims everything except these grid cells, to show where something appears. */
  highlight?: PairLocation | null;
  /** Increment to scroll the comparison into view (for example after "Show where"). */
  reveal?: number;
}

/** Merge a row's adjacent cells into runs, so highlights read as lines of text rather than tiles. */
function runs({ cols, cells }: PairLocation): { x: number; y: number; w: number }[] {
  const out: { x: number; y: number; w: number }[] = [];
  for (const c of [...cells].sort((a, b) => a - b)) {
    const x = c % cols;
    const y = Math.floor(c / cols);
    const last = out[out.length - 1];
    if (last && last.y === y && last.x + last.w === x) last.w++;
    else out.push({ x, y, w: 1 });
  }
  return out;
}

function Spotlight({ where, id }: { where: PairLocation; id: string }) {
  const boxes = runs(where);
  return (
    <svg
      className="compare__spotlight"
      viewBox={`0 0 ${where.cols} ${where.rows}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-testid="spotlight"
    >
      <defs>
        <mask id={id}>
          <rect width={where.cols} height={where.rows} fill="#fff" />
          {boxes.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={1} fill="#000" />
          ))}
        </mask>
      </defs>
      <rect className="compare__spotlight-dim" width={where.cols} height={where.rows} mask={`url(#${id})`} />
      {boxes.map((b, i) => (
        <rect key={i} className="compare__spotlight-edge" x={b.x} y={b.y} width={b.w} height={1} />
      ))}
    </svg>
  );
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Wipe between the original (left) and the simulated condition (right), framed
 * with crop marks like a calibration print. Drag anywhere on the image, or
 * focus the handle and use the arrow keys.
 */
export function BeforeAfterSlider({
  before,
  after,
  left,
  right,
  wipeKey,
  picking = false,
  onPick,
  highlight,
  reveal = 0,
}: Props) {
  const maskId = useId().replace(/[^a-zA-Z0-9_-]/g, "") + "-spot";
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

  // When picking starts or a location is shown, bring the screenshot into view:
  // the buttons that trigger both sit below it.
  useEffect(() => {
    if (!picking && reveal === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    frame.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [picking, reveal]);

  const moveTo = useCallback((clientX: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(clampPct(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (picking) {
      const rect = frame.current?.getBoundingClientRect();
      if (rect && rect.width && rect.height) {
        onPick?.(
          Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
          Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
        );
      }
      return;
    }
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
          className={`compare__frame${picking ? " is-picking" : ""}`}
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
          {highlight && highlight.cells.length > 0 && <Spotlight where={highlight} id={maskId} />}
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
