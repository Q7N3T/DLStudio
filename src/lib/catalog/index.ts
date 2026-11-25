import { MockProvider } from "./mock-provider";
import { CatalogError, type CatalogProvider } from "./provider";

export type { CatalogProvider } from "./provider";
export { CatalogError } from "./provider";
export { defaultQuery, parseCatalogParams, serializeCatalogQuery } from "./query";

let instance: CatalogProvider | null = null;

/**
 * Провайдер каталога по переменной окружения CATALOG_PROVIDER: "mock" (по умолчанию) или "woo".
 * Вызывать только на сервере (Server Components, Route Handlers).
 */
export function getCatalog(): CatalogProvider {
  if (instance) return instance;
  const kind = (process.env.CATALOG_PROVIDER ?? "mock").toLowerCase();
  switch (kind) {
    case "mock":
      instance = new MockProvider();
      break;
    case "woo":
      // Появится на этапе 5 (чтение через Store API)
      throw new CatalogError(
        "CATALOG_PROVIDER=woo пока не реализован (этап 5). Используйте CATALOG_PROVIDER=mock.",
      );
    default:
      throw new CatalogError(`Неизвестный CATALOG_PROVIDER="${kind}". Допустимо: mock, woo.`);
  }
  return instance;
}
