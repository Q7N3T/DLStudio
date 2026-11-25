import { allowFields, configureStoreSearch, defineMiddlewares } from "@medusajs/framework/http"

/** Поля студии, которые витрина может запросить у товара: ?fields=*studio или +studio.name */
const STUDIO_FIELDS = ["studio", "studio.id", "studio.name", "studio.handle"]

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`, so
    // the route narrows it to published products in the key's sales channels.
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // Связанная студия (src/links/product-studio.ts) в стандартных маршрутах товаров.
    // Без `method`: allowFields должен быть глобальным, иначе запрос проверяется раньше.
    {
      matcher: "/store/products",
      middlewares: [allowFields(...STUDIO_FIELDS)],
    },
    {
      matcher: "/store/products/:id",
      middlewares: [allowFields(...STUDIO_FIELDS)],
    },
  ],
})
