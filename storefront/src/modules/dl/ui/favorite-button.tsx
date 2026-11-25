"use client"

import { clx } from "@medusajs/ui"
import { useFavorites } from "@lib/dl/favorites"

/** Сердечко «В избранное». Лежит поверх ссылки на товар — клик не должен переходить по ней. */
export function FavoriteButton({ productId, label, className }: { productId: string; label: string; className?: string }) {
  const { has, toggle } = useFavorites()
  const active = has(productId)
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Убрать «${label}» из избранного` : `Добавить «${label}» в избранное`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId)
        if (navigator.vibrate) navigator.vibrate(8)
      }}
      className={clx(
        "inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 active:scale-90",
        className
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px]">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          className={clx(
            "transition-colors duration-150",
            active ? "fill-dl-brand-strong stroke-dl-brand-strong" : "fill-white/70 stroke-dl-fg"
          )}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
