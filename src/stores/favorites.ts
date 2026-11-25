"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  ids: number[];
  has: (id: number) => boolean;
  toggle: (id: number) => void;
}

/** Избранное без регистрации — хранится в localStorage. */
export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) =>
        set(({ ids }) => ({
          ids: ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids],
        })),
    }),
    { name: "dl-favorites", version: 1, partialize: ({ ids }) => ({ ids }) },
  ),
);
