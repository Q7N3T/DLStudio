"use client";

import { Heart, House, LayoutGrid, ShoppingBag, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CountBadge } from "@/components/shop/count-badge";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { selectCartCount, useCart } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Какие пути подсвечивают вкладку */
  match: (path: string) => boolean;
  counter?: "cart" | "favorites";
}

const TABS: Tab[] = [
  { href: "/", label: "Главная", icon: House, match: (p) => p === "/" },
  {
    href: "/catalog",
    label: "Каталог",
    icon: LayoutGrid,
    match: (p) =>
      p.startsWith("/catalog") ||
      p.startsWith("/product") ||
      p.startsWith("/about-the-studios") ||
      p.startsWith("/search"),
  },
  {
    href: "/favorites",
    label: "Избранное",
    icon: Heart,
    match: (p) => p.startsWith("/favorites"),
    counter: "favorites",
  },
  {
    href: "/cart",
    label: "Корзина",
    icon: ShoppingBag,
    match: (p) => p.startsWith("/cart") || p.startsWith("/checkout"),
    counter: "cart",
  },
  {
    href: "/account",
    label: "Профиль",
    icon: User,
    match: (p) => p.startsWith("/account") || p.startsWith("/login"),
  },
];

function TabBarInner({ pathname }: { pathname: string | null }) {
  const hydrated = useHydrated();
  const cart = useCart(selectCartCount);
  const fav = useFavorites((s) => s.ids.length);
  const counts = { cart: hydrated ? cart : 0, favorites: hydrated ? fav : 0 };

  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid h-[var(--tabbar-height)] grid-cols-5">
        {TABS.map((tab) => {
          const active = pathname !== null && tab.match(pathname);
          const count = tab.counter ? counts[tab.counter] : 0;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={count ? `${tab.label}, ${count}` : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-colors duration-150",
                  active ? "text-foreground" : "text-foreground-muted",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  <CountBadge count={count} />
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabBarWithPath() {
  const pathname = usePathname();
  return <TabBarInner pathname={pathname} />;
}

/**
 * Нижний таб-бар на мобильных. usePathname может приостановиться на маршрутах с
 * динамическими параметрами (Cache Components), поэтому есть Suspense с той же
 * панелью без подсветки активной вкладки.
 */
export function MobileTabBar() {
  return (
    <Suspense fallback={<TabBarInner pathname={null} />}>
      <TabBarWithPath />
    </Suspense>
  );
}
