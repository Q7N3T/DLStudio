import Link from "next/link"
import { HeaderActions } from "./header-actions"

const NAV = [
  { href: "/store?sortBy=created_at", label: "Новинки" },
  { href: "/categories/man", label: "Мужское" },
  { href: "/categories/woman", label: "Женское" },
  { href: "/categories/accessories", label: "Аксессуары" },
  { href: "/studios", label: "Студии" },
]

/**
 * Шапка: телефон — логотип и поиск (раздел/корзина/профиль — в таб-баре внизу),
 * десктоп — логотип, разделы, поиск, избранное, профиль, корзина.
 */
export function SiteHeader({ countryCode, cartCount }: { countryCode: string; cartCount: number }) {
  return (
    <header className="sticky top-0 z-50 border-b border-dl-border bg-dl-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-dl-surface focus:px-4 focus:py-3 focus:shadow-dl-md"
      >
        Перейти к содержимому
      </a>
      <div className="content-container flex h-14 items-center gap-4 !px-4 lg:h-16 lg:!px-6">
        <Link
          href={`/${countryCode}`}
          aria-label="DL Studio — на главную"
          className="inline-flex min-h-[44px] items-center font-display text-lg font-bold uppercase leading-none tracking-tight"
        >
          DL<span className="ml-1 font-medium">Studio</span>
        </Link>
        <nav aria-label="Основное" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={`/${countryCode}${item.href}`}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium hover:bg-dl-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="-mr-2 ml-auto lg:mr-0">
          <HeaderActions countryCode={countryCode} cartCount={cartCount} />
        </div>
      </div>
    </header>
  )
}
