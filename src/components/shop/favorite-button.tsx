"use client";

import { Heart } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/stores/favorites";

interface FavoriteButtonProps {
  productId: number;
  productTitle: string;
  className?: string;
}

/** Сердечко в углу карточки. Работает без регистрации (localStorage). */
export function FavoriteButton({ productId, productTitle, className }: FavoriteButtonProps) {
  const hydrated = useHydrated();
  const active = useFavorites((s) => s.ids.includes(productId)) && hydrated;
  const toggle = useFavorites((s) => s.toggle);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active ? `Убрать «${productTitle}» из избранного` : `Добавить «${productTitle}» в избранное`
      }
      onClick={(e) => {
        // Кнопка лежит поверх ссылки на товар
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-foreground transition-transform duration-150 active:scale-90",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "size-5 transition-colors duration-150",
          active ? "fill-brand-strong stroke-brand-strong" : "fill-surface/60",
        )}
      />
    </button>
  );
}
