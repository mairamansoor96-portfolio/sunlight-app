import { HONESTY, type Honesty } from "@/lib/simulations";

/**
 * Honesty label as a meter reading: the fuller the mark, the more you can trust
 * the result. Shape carries the meaning and the word is always shown, so it
 * reads without colour (SPEC.md → Honesty labels).
 */
export function TrustMark({ honesty }: { honesty: Honesty }) {
  return (
    <svg className={`mark mark--${honesty}`} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" />
      {honesty === "modelled" && <path d="M10 2a8 8 0 0 1 0 16z" />}
    </svg>
  );
}

export function TrustTag({ honesty }: { honesty: Honesty }) {
  return (
    <span className="tag" title={HONESTY[honesty].meaning}>
      <TrustMark honesty={honesty} />
      {HONESTY[honesty].name}
    </span>
  );
}
