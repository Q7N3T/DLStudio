import { searchCatalog, type CatalogScope } from "@lib/data/catalog"
import { listCategoryNodes, type CategoryNode } from "@lib/data/catalog-tree"
import { listStudios } from "@lib/data/studios"
import { emptyFilters, parseFilters, serializeFilters } from "@lib/dl/catalog-query"
import { pluralize } from "@lib/dl/format"
import Link from "next/link"
import { ProductGrid, ProductTile } from "../product/product-tile"
import { CatalogControls, CatalogSidebar, DesktopSort } from "./catalog-controls"
import { LoadMore } from "./load-more"

interface CatalogViewProps {
  countryCode: string
  /** Путь страницы без параметров: /ru/store, /ru/categories/man … */
  basePath: string
  title: string
  description?: string | null
  scope: CatalogScope
  searchParams: Record<string, string | string[] | undefined>
  /** Хлебные крошки над заголовком */
  crumbs?: { href: string; label: string }[]
}

/**
 * Общая страница-листинг: каталог, раздел, коллекция, студия, поиск.
 * Телефон: заголовок → подразделы чипсами → закреплённые «Фильтры / Сортировка» → чипсы фильтров → сетка 2 колонки.
 * Десктоп: фильтры слева, сетка 3–4 колонки.
 */
export async function CatalogView({ countryCode, basePath, title, description, scope, searchParams, crumbs }: CatalogViewProps) {
  const filters = parseFilters(searchParams)
  const [result, categories, studios] = await Promise.all([
    searchCatalog(scope, filters, countryCode, { cumulative: true }),
    listCategoryNodes(),
    listStudios(),
  ])

  const labels = {
    categories: Object.fromEntries(categories.map((c) => [c.handle, c.name])),
    studios: Object.fromEntries(studios.map((s) => [s.handle, s.name])),
  }
  const subcategories = childrenOf(categories, scope.category)
  const subWithCounts = subcategories
    .map((c) => ({ ...c, count: result.facets.categories.find((f) => f.value === c.handle)?.count ?? 0 }))
    .filter((c) => c.count > 0)
  const hasFilters = serializeFilters({ ...filters, page: 1, sort: "popular" }) !== ""

  return (
    <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_1.5rem)] pt-4 lg:!px-6 lg:pb-16 lg:pt-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Хлебные крошки" className="no-scrollbar mb-2 overflow-x-auto whitespace-nowrap text-sm text-dl-fg-muted">
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span aria-hidden> / </span>}
              <Link href={c.href} className="hover:text-dl-fg">
                {c.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-8 lg:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-dl-fg-muted" aria-live="polite">
            {result.total} {pluralize(result.total, ["товар", "товара", "товаров"])}
            {filters.inStockOnly ? " в наличии" : ""}
          </p>
        </div>
        <DesktopSort basePath={basePath} filters={filters} />
      </div>
      {description && <p className="mt-2 max-w-2xl text-sm text-dl-fg-muted">{description}</p>}

      {subWithCounts.length > 1 && (
        <nav aria-label="Подразделы" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {subWithCounts.map((c) => (
            <Link
              key={c.handle}
              href={`/${countryCode}/categories/${c.handle}${serializeFilters({ ...filters, page: 1, category: undefined })}`}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dl-border-strong bg-dl-surface px-4 text-sm hover:border-dl-fg"
            >
              {c.name}
              <span className="text-xs tabular-nums text-dl-fg-muted">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-3 lg:mt-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        <CatalogSidebar
          basePath={basePath}
          filters={filters}
          facets={result.facets}
          labels={labels}
          subcategories={subcategories}
        />
        <div className="min-w-0">
          <CatalogControls
            basePath={basePath}
            scope={scope}
            filters={filters}
            facets={result.facets}
            total={result.total}
            labels={labels}
            subcategories={subcategories}
          />

          {result.products.length === 0 ? (
            <EmptyState
              resetHref={`${basePath}${serializeFilters({ ...emptyFilters(), sort: filters.sort })}`}
              showAllHref={filters.inStockOnly ? `${basePath}${serializeFilters({ ...filters, inStockOnly: false, page: 1 })}` : null}
              hasFilters={hasFilters}
              catalogHref={`/${countryCode}/store`}
            />
          ) : (
            <ProductGrid className="mt-4">
              {result.products.map((p, i) => (
                <ProductTile key={p.id} product={p} countryCode={countryCode} priority={i < 4} />
              ))}
              <LoadMore
                scope={scope}
                filters={filters}
                countryCode={countryCode}
                basePath={basePath}
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                shown={result.products.length}
              />
            </ProductGrid>
          )}
        </div>
      </div>
    </div>
  )
}

function childrenOf(categories: CategoryNode[], handle?: string) {
  const parent = handle ? categories.find((c) => c.handle === handle) : undefined
  return categories
    .filter((c) => (parent ? c.parent_category_id === parent.id : !c.parent_category_id))
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((c) => ({ handle: c.handle, name: c.name }))
}

function EmptyState({
  resetHref,
  showAllHref,
  hasFilters,
  catalogHref,
}: {
  resetHref: string
  showAllHref: string | null
  hasFilters: boolean
  catalogHref: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-dl-muted" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-6 w-6">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <path d="M20 20l-3.5-3.5M8 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <h2 className="text-lg font-bold">{hasFilters ? "С такими фильтрами ничего нет" : "Здесь пока пусто"}</h2>
      <p className="mt-2 text-sm text-dl-fg-muted">
        {hasFilters
          ? "Попробуйте убрать часть фильтров или посмотреть распроданное — его иногда возвращают на склад."
          : "Новые вещи появляются каждую неделю. Загляните в общий каталог."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFilters && (
          <Link href={resetHref} className="inline-flex h-11 items-center rounded-md bg-dl-fg px-5 text-sm font-semibold text-white">
            Сбросить фильтры
          </Link>
        )}
        {showAllHref && (
          <Link href={showAllHref} className="inline-flex h-11 items-center rounded-md border border-dl-border-strong px-5 text-sm font-semibold">
            Показать распроданное
          </Link>
        )}
        {!hasFilters && (
          <Link href={catalogHref} className="inline-flex h-11 items-center rounded-md bg-dl-fg px-5 text-sm font-semibold text-white">
            Весь каталог
          </Link>
        )}
      </div>
    </div>
  )
}
