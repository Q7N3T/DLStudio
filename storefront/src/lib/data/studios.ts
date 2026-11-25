"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export interface Studio {
  id: string
  name: string
  handle: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
}

/** Список студий (страница «Студии», фильтр каталога) */
export async function listStudios(): Promise<Studio[]> {
  const next = { ...(await getCacheOptions("studios")) }
  return sdk.client
    .fetch<{ studios: Studio[] }>(`/store/studios`, { method: "GET", next, cache: "force-cache" })
    .then(({ studios }) => studios)
    .catch(() => [])
}

/** Студия по handle + ID её товаров (для «Ещё от этой студии») */
export async function getStudio(handle: string): Promise<(Studio & { product_ids: string[] }) | null> {
  const next = { ...(await getCacheOptions("studios")) }
  return sdk.client
    .fetch<{ studio: Studio & { product_ids: string[] } }>(`/store/studios/${encodeURIComponent(handle)}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ studio }) => studio)
    .catch(() => null)
}
