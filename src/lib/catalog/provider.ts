import type {
  CatalogQuery,
  Category,
  Product,
  ProductList,
  ProductSummary,
  SearchSuggestions,
  Studio,
  Tag,
} from "./types";

/**
 * Единственная точка доступа витрины к данным каталога.
 * Реализации: MockProvider (JSON-фикстуры) и WooProvider (Store API, этап 5).
 * Все методы возвращают доменные типы; ошибки сети пробрасываются как CatalogError.
 */
export interface CatalogProvider {
  readonly name: "mock" | "woo";

  /** Листинг с фильтрами, сортировкой, фасетами и пагинацией */
  listProducts(query: CatalogQuery): Promise<ProductList>;
  getProduct(slug: string): Promise<Product | null>;
  /** Для избранного и корзины; порядок как в `ids`, отсутствующие пропускаются */
  getProductsByIds(ids: number[]): Promise<ProductSummary[]>;
  /** «Похожие» (та же категория) и «Ещё от этой студии» */
  getRelated(
    product: Product,
    limit?: number,
  ): Promise<{ similar: ProductSummary[]; sameStudio: ProductSummary[] }>;

  getCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | null>;
  getStudios(): Promise<Studio[]>;
  getStudio(slug: string): Promise<Studio | null>;
  getTag(slug: string): Promise<Tag | null>;

  /** Подсказки поиска: товары с фото, категории, студии */
  suggest(q: string, limit?: number): Promise<SearchSuggestions>;
}

export class CatalogError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CatalogError";
  }
}
