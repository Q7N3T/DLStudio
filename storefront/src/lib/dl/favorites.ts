"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Избранное без регистрации: ID товаров в localStorage, синхронизация между вкладками.
 * useSyncExternalStore → на сервере и при гидратации пустой список (без mismatch).
 */
const KEY = "dl-favorites"
const EVENT = "dl:favorites"

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

let cache: string[] | null = null
const snapshot = () => (cache ??= read())
// Один и тот же пустой массив: React требует стабильный снимок, иначе бесконечные ререндеры
const EMPTY: string[] = []
const serverSnapshot = (): string[] => EMPTY

function subscribe(cb: () => void) {
  const onChange = () => {
    cache = read()
    cb()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function toggleFavorite(id: string) {
  const ids = read()
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT))
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const has = useCallback((id: string) => ids.includes(id), [ids])
  return { ids, has, toggle: toggleFavorite }
}
