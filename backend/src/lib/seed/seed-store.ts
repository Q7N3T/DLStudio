import type { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { STUDIO_MODULE } from "../../modules/studio"
import type StudioModuleService from "../../modules/studio/service"
import { DEFAULT_TARIFFS } from "../../modules/dlstudio-shipping/tariffs"
import { RU_REGION_STORE_POLICIES } from "../region-store-policies"
import { COLOR_OPTION, ONE_SIZE, prepareProduct, SIZE_OPTION } from "./build-product"
import { NON_CATEGORY_SLUGS, orderedCategories, SEED_COLLECTIONS } from "./catalog-structure"
import { SNAPSHOT } from "./snapshot"

const CURRENCY = "rub"
const COUNTRY = "ru"
/** provider_id заглушки СДЭК / Почта России: identifier "dlstudio-shipping" + id "stub" */
const SHIPPING_PROVIDER_ID = "dlstudio-shipping_stub"

/**
 * Начальные данные DL Studio: магазин, регион «Россия» (₽, цены с налогом), склады в Москве
 * и Китае, доставка СДЭК / Почтой и каталог из снимка dlstudio.store (data/dlstudio-snapshot.json):
 * категории, коллекции, студии, ~70 реальных товаров с фото, описанием, замерами и составом,
 * остатки, распродажа и промокод AUTUMN.
 *
 * Запускается один раз как migration-script при первом `medusa db:migrate`.
 */
export async function seedDlStudio(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const studioService: StudioModuleService = container.resolve(STUDIO_MODULE)

  /* ── Канал продаж, публичный ключ, магазин ─────────────────────────────── */
  logger.info("Сид: магазин и канал продаж…")
  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [{ name: "Витрина dlstudio.store", description: "Интернет-магазин" }],
    },
  })

  const {
    result: [publishableKey],
  } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Витрина", type: "publishable", created_by: "" }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "DL Studio",
          supported_currencies: [{ currency_code: CURRENCY, is_default: true, is_tax_inclusive: true }],
          default_sales_channel_id: salesChannel.id,
        },
      ],
    },
  })

  /* ── Регион и налоги ───────────────────────────────────────────────────── */
  logger.info("Сид: регион «Россия»…")
  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Россия",
          currency_code: CURRENCY,
          countries: [COUNTRY],
          // ЮKassa подключается на этапе 4; пока — системный провайдер для тестовых заказов
          payment_providers: ["pp_system_default"],
          is_tax_inclusive: true,
          automatic_taxes: true,
          metadata: { ...RU_REGION_STORE_POLICIES },
        },
      ],
    },
  })
  // Цены указаны с учётом налогов; ставка по умолчанию не задана (уточняется у владельца)
  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: COUNTRY, provider_id: "tp_system" }],
  })

  /* ── Склады и доставка ─────────────────────────────────────────────────── */
  logger.info("Сид: склады и доставка…")
  const { result: locations } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Склад в Москве",
          address: { city: "Москва", country_code: "RU", address_1: "" },
          metadata: { delivery_origin: "russia" },
        },
        {
          name: "Склад в Китае (Гуанчжоу)",
          address: { city: "Гуанчжоу", country_code: "CN", address_1: "" },
          metadata: { delivery_origin: "china" },
        },
      ],
    },
  })
  const [moscow, china] = locations

  // Товары из Китая консолидируются в Москве и уходят покупателю тем же перевозчиком,
  // поэтому варианты доставки привязаны к московскому складу.
  for (const location of locations) {
    await link.create([
      {
        [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: SHIPPING_PROVIDER_ID },
      },
      {
        [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      },
    ])
  }

  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const shippingProfile = profiles[0]

  const fulfillmentSet = await fulfillment.createFulfillmentSets({
    name: "Доставка по России",
    type: "shipping",
    service_zones: [{ name: "Россия", geo_zones: [{ country_code: COUNTRY, type: "country" }] }],
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: moscow.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  await createShippingOptionsWorkflow(container).run({
    input: Object.values(DEFAULT_TARIFFS).map((t) => ({
      name: t.name,
      price_type: "calculated" as const,
      provider_id: SHIPPING_PROVIDER_ID,
      service_zone_id: fulfillmentSet.service_zones[0].id,
      shipping_profile_id: shippingProfile.id,
      data: { id: t.code, carrier: t.code },
      type: {
        label: t.name,
        description: `${t.description}, ${t.days_min}–${t.days_max} дней`,
        code: t.code,
      },
      rules: storeRules,
    })),
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: moscow.id, add: [salesChannel.id] },
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: china.id, add: [salesChannel.id] },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_region_id: region.id, default_location_id: moscow.id },
    },
  })

  /* ── Справочники каталога ──────────────────────────────────────────────── */
  logger.info("Сид: категории, коллекции, студии…")
  const categoryIds = new Map<string, string>()
  const categories = orderedCategories(SNAPSHOT.categories)
  // По одной: родитель всегда создан раньше детей (orderedCategories)
  for (const [rank, c] of categories.entries()) {
    const {
      result: [created],
    } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: c.name,
            handle: c.handle,
            description: c.description ?? undefined,
            is_active: true,
            is_internal: false,
            rank,
            parent_category_id: c.parent ? categoryIds.get(c.parent) ?? null : null,
          },
        ],
      },
    })
    categoryIds.set(created.handle, created.id)
  }

  const { result: collections } = await createCollectionsWorkflow(container).run({
    input: { collections: SEED_COLLECTIONS.map((c) => ({ title: c.title, handle: c.handle })) },
  })
  const collectionIds = new Map(collections.map((c) => [c.handle, c.id]))

  const studios = await studioService.createStudios(
    SNAPSHOT.studios.map((s) => ({ handle: s.handle, name: s.name }))
  )
  const studioByHandle = new Map(studios.map((s) => [s.handle, s]))

  const typeValues = [...new Set(SNAPSHOT.products.map((p) => p.type).filter((t): t is string => !!t))]
  const { result: types } = await createProductTypesWorkflow(container).run({
    input: { product_types: typeValues.map((value) => ({ value })) },
  })
  const typeIds = new Map(types.map((t) => [t.value, t.id]))

  const tagValues = [...new Set(SNAPSHOT.products.flatMap((p) => [...p.collections, ...p.releases]))]
  const { result: tags } = await createProductTagsWorkflow(container).run({
    input: { product_tags: tagValues.map((value) => ({ value })) },
  })
  const tagIds = new Map(tags.map((t) => [t.value, t.id]))

  /* ── Товары ────────────────────────────────────────────────────────────── */
  const prepared = SNAPSHOT.products.map((seed) => ({ seed, product: prepareProduct(seed) }))

  // Общие (глобальные) опции «Цвет» и «Размер»: витрина фильтрует по ним весь каталог
  const allValues = (title: string) => [
    ...new Set(
      prepared.flatMap(({ product }) => product.options.find((o) => o.title === title)?.values ?? [])
    ),
  ]
  const { result: options } = await createProductOptionsWorkflow(container).run({
    input: {
      product_options: [
        { title: COLOR_OPTION, values: allValues(COLOR_OPTION) },
        { title: SIZE_OPTION, values: [...new Set([...allValues(SIZE_OPTION), ONE_SIZE])] },
      ],
    },
  })
  const optionIds = new Map(options.map((o) => [o.title, o.id]))
  // id значений общих опций: товар подключает только свои значения (value_ids),
  // иначе ему достаются все размеры/цвета каталога и фильтры на витрине врут
  const valueIds = new Map(
    options.map((o) => [o.title, new Map((o.values ?? []).map((v) => [v.value, v.id]))])
  )

  logger.info(`Сид: товары (${prepared.length})…`)
  // Старые товары создаём первыми, чтобы сортировка «новинки» (по дате) совпадала с сайтом
  const ordered = [...prepared].sort((a, b) => a.seed.ref - b.seed.ref)
  const createdProducts: { id: string; handle: string }[] = []
  for (const { seed, product } of ordered) {
    const collection =
      seed.categories.includes("final-winter-edit") ? "final-winter-edit" : seed.collections[0]
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: product.title,
            subtitle: product.subtitle ?? undefined,
            handle: product.handle,
            description: product.description,
            status: ProductStatus.PUBLISHED,
            type_id: seed.type ? typeIds.get(seed.type) : undefined,
            collection_id: collection ? collectionIds.get(collection) : undefined,
            category_ids: seed.categories
              .filter((h) => !NON_CATEGORY_SLUGS.has(h))
              .map((h) => categoryIds.get(h))
              .filter((id): id is string => !!id),
            tag_ids: [...seed.collections, ...seed.releases].map((t) => tagIds.get(t)!),
            thumbnail: seed.images[0]?.url,
            images: seed.images.map((img) => ({ url: img.url })),
            shipping_profile_id: shippingProfile.id,
            sales_channels: [{ id: salesChannel.id }],
            options: product.options.map((o) => ({
              id: optionIds.get(o.title)!,
              value_ids: o.values.map((v) => valueIds.get(o.title)!.get(v)!),
            })),
            variants: product.variants.map((v) => ({
              title: v.title,
              sku: v.sku,
              options: v.options,
              manage_inventory: true,
              allow_backorder: false,
              prices: [{ amount: v.price, currency_code: CURRENCY }],
            })),
            metadata: {
              delivery_origin: product.origin,
              legacy_ref: seed.ref,
              legacy_sku: seed.sku,
              legacy_url: seed.permalink,
              legacy_slug: seed.slug,
              // «Нижняя часть» карточки: сезон, замеры, состав, уход, характеристики
              details: product.details,
              image_alts: seed.images.map((img) => img.alt),
            },
          },
        ],
      },
    })
    createdProducts.push(...result.map((p) => ({ id: p.id, handle: p.handle })))
  }

  const productIdByHandle = new Map(createdProducts.map((p) => [p.handle, p.id]))
  const studioLinks = prepared
    .filter(({ seed }) => seed.studio && studioByHandle.has(seed.studio))
    .map(({ seed, product }) => ({
      [Modules.PRODUCT]: { product_id: productIdByHandle.get(product.handle)! },
      [STUDIO_MODULE]: { studio_id: studioByHandle.get(seed.studio!)!.id },
    }))
  if (studioLinks.length) await link.create(studioLinks)

  /* ── Остатки ───────────────────────────────────────────────────────────── */
  logger.info("Сид: остатки на складах…")
  const stockBySku = new Map(
    prepared.flatMap(({ product }) => product.variants.map((v) => [v.sku, v.stock] as const))
  )
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.flatMap((item) => {
        const stock = stockBySku.get(item.sku ?? "") ?? { china: 0, russia: 0 }
        return [
          { location_id: moscow.id, inventory_item_id: item.id, stocked_quantity: stock.russia },
          { location_id: china.id, inventory_item_id: item.id, stocked_quantity: stock.china },
        ]
      }),
    },
  })

  /* ── Распродажа и промокод ─────────────────────────────────────────────── */
  logger.info("Сид: распродажа и промокод AUTUMN…")
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku"],
  })
  const variantIdBySku = new Map(variants.map((v) => [v.sku, v.id]))
  const salePrices = prepared.flatMap(({ product }) =>
    product.variants
      .filter((v) => v.salePrice)
      .map((v) => ({
        variant_id: variantIdBySku.get(v.sku)!,
        amount: v.salePrice!,
        currency_code: CURRENCY,
      }))
  )
  if (salePrices.length) {
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "Распродажа",
            // Тип по умолчанию — sale: цена применяется, только если она ниже обычной
            description: "Скидочные цены. Витрина показывает старую цену зачёркнутой.",
            status: "active",
            prices: salePrices,
          },
        ],
      },
    })
  }

  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "AUTUMN",
          type: "standard",
          status: "active",
          is_automatic: false,
          is_tax_inclusive: true,
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: 10,
            currency_code: CURRENCY,
          },
        },
      ],
    },
  })

  logger.info(
    `Сид завершён. Товары: ${createdProducts.length}, студии: ${studios.length}, категории: ${categoryIds.size}, цены в распродаже: ${salePrices.length}.`
  )
}
