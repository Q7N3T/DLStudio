"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

/**
 * Действия корзины DL Studio поверх Store API, которых нет в стартере
 * (снятие промокода, адрес + доставка одним шагом оформления).
 */

async function invalidate() {
  const [cart, fulfillment] = await Promise.all([getCacheTag("carts"), getCacheTag("fulfillment")])
  revalidateTag(cart, { expire: 0 })
  revalidateTag(fulfillment, { expire: 0 })
}

/** Снять промокод */
export async function removePromotion(code: string) {
  const cartId = await getCartId()
  if (!cartId) throw new Error("Корзина не найдена")
  await sdk.client.fetch(`/store/carts/${cartId}/promotions`, {
    method: "DELETE",
    body: { promo_codes: [code] },
    headers: { ...(await getAuthHeaders()) },
  })
  await invalidate()
}

/** Применить промокод: возвращает текст ошибки по-человечески или null */
export async function applyPromotion(code: string): Promise<string | null> {
  const cartId = await getCartId()
  if (!cartId) return "Корзина не найдена. Обновите страницу."
  const clean = code.trim().toUpperCase()
  if (!clean) return "Введите промокод"
  try {
    const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      body: { promo_codes: [clean] },
      headers: { ...(await getAuthHeaders()) },
      query: { fields: "*promotions" },
    })
    await invalidate()
    const applied = (cart.promotions ?? []).some((p) => p.code?.toUpperCase() === clean)
    return applied ? null : "Такого промокода нет или он уже не действует"
  } catch {
    return "Не получилось применить промокод. Попробуйте ещё раз."
  }
}

export interface CheckoutAddressInput {
  email: string
  first_name: string
  last_name: string
  phone: string
  city: string
  address_1: string
  postal_code: string
}

/** Контакты и адрес одним запросом (адрес оплаты = адрес доставки) */
export async function saveCheckoutAddress(input: CheckoutAddressInput): Promise<string | null> {
  const cartId = await getCartId()
  if (!cartId) return "Корзина не найдена. Обновите страницу."
  const address = {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    phone: input.phone,
    city: input.city.trim(),
    address_1: input.address_1.trim(),
    postal_code: input.postal_code.trim(),
    country_code: "ru",
  }
  try {
    await sdk.store.cart.update(
      cartId,
      { email: input.email.trim(), shipping_address: address, billing_address: address },
      {},
      { ...(await getAuthHeaders()) }
    )
    await invalidate()
    return null
  } catch {
    return "Не получилось сохранить адрес. Проверьте поля и попробуйте ещё раз."
  }
}
