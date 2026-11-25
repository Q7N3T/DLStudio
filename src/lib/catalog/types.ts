import type { DeliveryType } from "@/config/delivery";

/**
 * Доменная модель витрины. UI работает только с этими типами;
 * провайдеры (MockProvider, WooProvider) приводят к ним сырые ответы Store API.
 */

export type Gender = "man" | "woman";

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Studio {
  id: number;
  slug: string;
  name: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  count: number;
  image?: ImageAsset;
}

export interface ColorOption {
  slug: string;
  name: string;
  /** Для свотча; если неизвестен — показываем подпись */
  hex?: string;
}

export interface SizeOption {
  value: string;
  inStock: boolean;
}

export interface Variation {
  id: number;
  color?: string; // ColorOption.slug
  size?: string; // SizeOption.value
  inStock: boolean;
}

export interface Price {
  /** Цена в рублях (целое) */
  current: number;
  /** Цена без скидки; равна current, если скидки нет */
  regular: number;
  /** Диапазон для вариативных товаров */
  min?: number;
  max?: number;
}

/** Достаточно для карточки в сетке. */
export interface ProductSummary {
  id: number;
  slug: string;
  /** Короткое название: «Deconstructed High Top Training Boots» */
  title: string;
  /** Тип товара: «Ботинки» */
  productType: string;
  studio: Studio | null;
  price: Price;
  onSale: boolean;
  images: ImageAsset[];
  colors: ColorOption[];
  sizes: SizeOption[];
  inStock: boolean;
  delivery: DeliveryType;
  isNew: boolean;
}

export interface Product extends ProductSummary {
  sku: string;
  descriptionHtml: string;
  shortDescriptionHtml: string;
  categories: Pick<Category, "id" | "slug" | "name">[];
  tags: { id: number; slug: string; name: string }[];
  variations: Variation[];
  gender: Gender | "unisex";
  averageRating: number;
  reviewCount: number;
}
