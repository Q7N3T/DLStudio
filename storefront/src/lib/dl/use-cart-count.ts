"use client"

import { retrieveCart } from "@lib/data/cart"
import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { useEffect, useState } from "react"

/**
 * Число товаров в корзине для шапки и таб-бара. Начальное значение приходит с сервера,
 * после добавления/удаления (событие medusa:cart-updated) перечитываем корзину.
 */
export function useCartCount(initial: number) {
  const [count, setCount] = useState(initial)
  // Новое значение с сервера (навигация) — сбрасываем без эффекта, во время рендера
  const [prevInitial, setPrevInitial] = useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setCount(initial)
  }

  useEffect(() => {
    const load = () =>
      retrieveCart(undefined, "id,*items")
        .then((cart) => setCount((cart?.items ?? []).reduce((n, i) => n + (i.quantity ?? 0), 0)))
        .catch(() => {})
    window.addEventListener(CART_UPDATED_EVENT, load)
    return () => window.removeEventListener(CART_UPDATED_EVENT, load)
  }, [])

  return count
}
