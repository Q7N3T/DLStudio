"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Gender } from "@/lib/catalog/types";

interface PreferencesState {
  gender: Gender;
  setGender: (gender: Gender) => void;
}

/** «Мужчинам / Женщинам» — запоминается между визитами. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      gender: "man",
      setGender: (gender) => set({ gender }),
    }),
    { name: "dl-preferences", version: 1 },
  ),
);
