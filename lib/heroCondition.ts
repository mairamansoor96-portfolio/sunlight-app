/**
 * A tiny shared store so the header's light meter can follow the live hero's
 * tour without lifting state through the page.
 */

import { useSyncExternalStore } from "react";

let current = "monitor";
const listeners = new Set<() => void>();

export function publishHeroCondition(id: string): void {
  if (id === current) return;
  current = id;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHeroCondition(): string {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "monitor",
  );
}
