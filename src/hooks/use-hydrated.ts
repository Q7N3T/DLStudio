"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false во время SSR и первой гидрации, true после. Нужен, чтобы значения из
 * localStorage (счётчики корзины/избранного, выбранный пол) не давали hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
