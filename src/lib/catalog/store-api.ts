/**
 * Подмножество схемы WooCommerce Store API v1, которое использует витрина.
 * Сверено с ответами dlstudio.store/wp-json/wc/store/v1 (25.11.2026).
 * Моки (src/mocks/store-api/*.json) обязаны соответствовать этим типам.
 */

export interface StoreImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface StorePrices {
  /** Строки в минорных единицах; для RUB currency_minor_unit = 0 → рубли */
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: { min_amount: string; max_amount: string } | null;
  currency_code: string;
  currency_minor_unit: number;
}

export interface StoreTermRef {
  id: number;
  name: string;
  slug: string;
  link?: string;
}

export interface StoreAttribute {
  id: number;
  name: string; // «Цвет», «Размер»
  taxonomy: string | null; // pa_color, pa_size или null для локальных атрибутов
  has_variations: boolean;
  terms: StoreTermRef[];
}

export interface StoreVariationRef {
  id: number;
  attributes: { name: string; value: string }[];
}

export interface StoreProduct {
  id: number;
  name: string; // может содержать HTML-сущности: «Пуховик &#171;…&#187;»
  slug: string;
  parent: number;
  type: "simple" | "variable" | "variation" | "grouped" | "external";
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: StorePrices;
  average_rating: string;
  review_count: number;
  images: StoreImage[];
  categories: StoreTermRef[];
  tags: StoreTermRef[];
  attributes: StoreAttribute[];
  /** Только существующие вариации, без остатков */
  variations: StoreVariationRef[];
  is_purchasable: boolean;
  is_in_stock: boolean;
  is_on_backorder: boolean;
  low_stock_remaining: number | null;
}

export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: StoreImage | null;
  permalink: string;
}

export interface StoreTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface StoreAttributeTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}
