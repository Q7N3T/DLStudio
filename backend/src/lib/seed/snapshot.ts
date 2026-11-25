import snapshotJson from "./data/dlstudio-snapshot.json"

/**
 * Снимок реального каталога dlstudio.store (tools/snapshot-dlstudio.mjs).
 * Только данные: никакой логики Medusa — её делает build-product.ts / seed-store.ts.
 */

export interface SizeChart {
  columns: string[]
  rows: string[][]
}

/** «Нижняя часть» карточки, разобранная из HTML описания WooCommerce */
export interface ProductDetails {
  paragraphs: string[]
  season: string | null
  model_params: string[]
  size_chart: SizeChart | null
  size_chart_note: string | null
  composition: string[]
  care: string | null
  temperature: string | null
  features: { label: string; value: string }[]
}

export interface SnapshotProduct {
  ref: number
  slug: string
  sku: string
  name: string
  type: string | null
  title: string
  studio: string | null
  categories: string[]
  russia: boolean
  collections: string[]
  releases: string[]
  in_stock: boolean
  price: number
  sale_price: number | null
  colors: { slug: string; name: string }[]
  sizes: string[]
  variations: { color: string | null; size: string | null }[]
  images: { url: string; alt: string }[]
  details: ProductDetails
  permalink: string
}

export interface SnapshotCategory {
  handle: string
  name: string
  parent: string | null
  description: string | null
  used: boolean
}

export interface Snapshot {
  source: string
  taken_at: string
  categories: SnapshotCategory[]
  studios: { handle: string; name: string }[]
  products: SnapshotProduct[]
}

export const SNAPSHOT = snapshotJson as Snapshot
