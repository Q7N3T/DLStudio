"use client";

import { Heart, Package, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { CountBadge } from "@/components/shop/count-badge";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { selectCartCount, useCart } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";

const iconLink =
  "relative inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors duration-150 hover:bg-muted";

/** Иконки справа в шапке. На мобильных — только «Отследить заказ»: остальное в таб-баре. */
export function HeaderActions() {
  const hydrated = useHydrated();
  const cartCount = useCart(selectCartCount);
  const favCount = useFavorites((s) => s.ids.length);
  const cart = hydrated ? cartCount : 0;
  const fav = hydrated ? favCount : 0;

  return (
    <nav aria-label="Личное" className="flex items-center">
      <Link
        href="/track"
        // На экранах уже 360px трекинг доступен из профиля и футера
        className={cn(iconLink, "max-[359px]:hidden")}
        aria-label="Отследить заказ"
        title="Отследить заказ"
      >
        <Package className="size-5" aria-hidden />
      </Link>
      <Link
        href="/favorites"
        className={cn(iconLink, "hidden lg:inline-flex")}
        aria-label={fav ? `Избранное, ${fav}` : "Избранное"}
      >
        <Heart className="size-5" aria-hidden />
        <CountBadge count={fav} className="top-1 right-0.5" />
      </Link>
      <Link href="/account" className={cn(iconLink, "hidden lg:inline-flex")} aria-label="Профиль">
        <User className="size-5" aria-hidden />
      </Link>
      <Link
        href="/cart"
        className={cn(iconLink, "hidden lg:inline-flex")}
        aria-label={cart ? `Корзина, ${cart}` : "Корзина"}
      >
        <ShoppingBag className="size-5" aria-hidden />
        <CountBadge count={cart} className="top-1 right-0.5" />
      </Link>
    </nav>
  );
}
