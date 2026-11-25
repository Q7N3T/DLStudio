"use client"

import { clx } from "@medusajs/ui"
import { useFavorites } from "@lib/dl/favorites"
import { useCartCount } from "@lib/dl/use-cart-count"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

type Counter = "cart" | "favorites"
const TABS: { path: string; label: string; icon: string; match: (p: string) => boolean; counter?: Counter }[] = [
  { path: "", label: "Главная", icon: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z", match: (p) => p === "" },
  {
    path: "/store",
    label: "Каталог",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    match: (p) => /^\/(store|categories|collections|products|studios|search)/.test(p),
  },
  {
    path: "/favorites",
    label: "Избранное",
    icon: "M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z",
    match: (p) => p.startsWith("/favorites"),
    counter: "favorites",
  },
  {
    path: "/cart",
    label: "Корзина",
    icon: "M5 7h14l-1.2 12.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 7V6a3 3 0 016 0v1",
    match: (p) => p.startsWith("/cart") || p.startsWith("/checkout"),
    counter: "cart",
  },
  {
    path: "/account",
    label: "Профиль",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    match: (p) => p.startsWith("/account") || p.startsWith("/order"),
  },
]

/** Нижний таб-бар на телефоне со счётчиками корзины и избранного */
export function TabBar({ cartCount }: { cartCount: number }) {
  const { countryCode } = useParams() as { countryCode: string }
  const pathname = usePathname() ?? ""
  const rest = pathname.replace(new RegExp(`^/${countryCode}`), "")
  const cart = useCartCount(cartCount)
  const { ids } = useFavorites()
  const counts: Record<Counter, number> = { cart, favorites: ids.length }

  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-dl-border bg-dl-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid h-[var(--dl-tabbar-h)] grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(rest)
          const count = tab.counter ? counts[tab.counter] : 0
          return (
            <li key={tab.label}>
              <Link
                href={`/${countryCode}${tab.path}`}
                aria-current={active ? "page" : undefined}
                aria-label={count ? `${tab.label}, ${count}` : undefined}
                className={clx(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-dl-fg" : "text-dl-fg-muted"
                )}
              >
                <span className="relative">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path
                      d={tab.icon}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={active ? 2.1 : 1.6}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-dl-brand-strong px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
