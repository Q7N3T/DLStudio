"use client"

import { useFavorites } from "@lib/dl/favorites"
import { useCartCount } from "@lib/dl/use-cart-count"
import Link from "next/link"

const iconLink =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-md text-dl-fg transition-colors hover:bg-dl-muted"

function Count({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="absolute right-0.5 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-dl-brand-strong px-1 text-[10px] font-bold leading-none text-white tabular-nums">
      {n > 99 ? "99+" : n}
    </span>
  )
}

/** Иконки справа в шапке. На телефоне — только поиск; остальное в таб-баре. */
export function HeaderActions({ countryCode, cartCount }: { countryCode: string; cartCount: number }) {
  const cart = useCartCount(cartCount)
  const { ids } = useFavorites()
  return (
    <div className="flex items-center">
      <Link href={`/${countryCode}/search`} className={iconLink} aria-label="Поиск">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>
      <Link href={`/${countryCode}/favorites`} className={`${iconLink} hidden lg:inline-flex`} aria-label={ids.length ? `Избранное, ${ids.length}` : "Избранное"}>
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
          <path
            d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
            stroke="currentColor"
            strokeWidth="1.7"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
        <Count n={ids.length} />
      </Link>
      <Link href={`/${countryCode}/account`} className={`${iconLink} hidden lg:inline-flex`} aria-label="Профиль">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.7" fill="none" />
        </svg>
      </Link>
      <Link href={`/${countryCode}/cart`} className={`${iconLink} hidden lg:inline-flex`} aria-label={cart ? `Корзина, ${cart}` : "Корзина"}>
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
          <path d="M5 7h14l-1.2 12.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 7V6a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
        </svg>
        <Count n={cart} />
      </Link>
    </div>
  )
}
