"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export interface CategoryNode {
  id: string
  handle: string
  name: string
  description: string | null
  parent_category_id: string | null
  rank: number | null
}

/** Все категории одним запросом (их десятки): для названий, хлебных крошек и подразделов */
export async function listCategoryNodes(): Promise<CategoryNode[]> {
  const next = { ...(await getCacheOptions("categories")) }
  return sdk.client
    .fetch<{ product_categories: CategoryNode[] }>("/store/product-categories", {
      query: { fields: "id,handle,name,description,parent_category_id,rank", limit: 500 },
      next,
      cache: "force-cache",
    })
    .then(({ product_categories }) => product_categories)
    .catch(() => [])
}
