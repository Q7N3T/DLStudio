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

/** Студия = тег WooCommerce, имя которого совпадает с термином атрибута «Студия» (pa_brand). */
export interface Studio {
  id: number;
  slug: string;
  name: string;
  count?: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  count: number;
  image?: ImageAsset;
}

export interface Tag {
  id: number;
  slug: string;
  name: string;
}

export interface ColorOption {
  slug: string;
  name: string;
  /** CSS background для свотча; если неизвестен — показываем подпись */
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
  /** Полное название из WooCommerce, уже без HTML-сущностей */
  fullName: string;
  descriptionHtml: string;
  shortDescriptionHtml: string;
  categories: Pick<Category, "id" | "slug" | "name">[];
  tags: Tag[];
  variations: Variation[];
  gender: Gender | "unisex";
  averageRating: number;
  reviewCount: number;
}

/* ---------- Запрос каталога ---------- */

export type SortKey = "popular" | "new" | "price-asc" | "price-desc";

export interface CatalogQuery {
  /** Слаг категории (включая подкатегории) */
  category?: string;
  /** Слаг тега: подборка, релиз или студия */
  tag?: string;
  gender?: Gender;
  q?: string;
  sizes: string[];
  colors: string[];
  studios: string[];
  delivery: DeliveryType[];
  priceMin?: number;
  priceMax?: number;
  /** По умолчанию true: распроданное скрыто */
  inStockOnly: boolean;
  sort: SortKey;
  page: number;
  perPage: number;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface CatalogFacets {
  categories: FacetOption[];
  sizes: FacetOption[];
  colors: (FacetOption & { hex?: string })[];
  studios: FacetOption[];
  delivery: FacetOption[];
  price: { min: number; max: number };
}

export interface ProductList {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  facets: CatalogFacets;
}

export interface SearchSuggestions {
  products: ProductSummary[];
  categories: Category[];
  studios: Studio[];
}
