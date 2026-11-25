/**
 * Тематические подборки главной. Слаги сверены с тегами WooCommerce
 * (GET /wp-json/wc/store/v1/products/tags, 25.11.2026).
 * Ссылки ведут на сохранённые адреса /product-tag/<slug>/.
 */
export const COLLECTIONS = [
  { slug: "streetwear-essentials", title: "Streetwear" },
  { slug: "minimalist-chic", title: "Minimalist" },
  { slug: "techwear-vibes", title: "Techwear" },
  { slug: "retro-vibes", title: "Retro" },
] as const;

/** Теги релизов имеют вид release-DDMMYY / release-DDMM. */
export const RELEASE_TAG_PREFIX = "release-";
