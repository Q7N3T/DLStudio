"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryType } from "@/config/delivery";

/**
 * Локальная корзина. На этапе 3 обрастёт промокодом и итогами,
 * на этапе 5 — синхронизацией с корзиной Store API.
 */
export interface CartLine {
  /** ID вариации (или товара, если он простой) */
  id: number;
  productId: number;
  slug: string;
  title: string;
  studio: string | null;
  image?: string;
  color?: string;
  size?: string;
  price: number;
  regularPrice: number;
  delivery: DeliveryType;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set(({ lines }) => {
          const existing = lines.find((l) => l.id === line.id);
          if (existing) {
            return {
              lines: lines.map((l) =>
                l.id === line.id ? { ...l, quantity: l.quantity + quantity } : l,
              ),
            };
          }
          return { lines: [...lines, { ...line, quantity }] };
        }),
      setQuantity: (id, quantity) =>
        set(({ lines }) => ({
          lines:
            quantity <= 0
              ? lines.filter((l) => l.id !== id)
              : lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
        })),
      remove: (id) => set(({ lines }) => ({ lines: lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "dl-cart", version: 1, partialize: ({ lines }) => ({ lines }) },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
