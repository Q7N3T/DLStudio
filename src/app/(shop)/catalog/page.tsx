import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard, ProductGrid, ProductGridSkeleton } from "@/components/shop/product-card";
import { EmptyState } from "@/components/shop/states";
import { Button } from "@/components/ui/button";
import { getCatalog, parseCatalogParams, serializeCatalogQuery } from "@/lib/catalog";
import type { CatalogQuery, SortKey } from "@/lib/catalog/types";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Одежда, обувь и аксессуары независимых студий из Китая.",
};

/**
 * Минимальный каталог для проверки витрины на моках.
 * Полноценный листинг (фильтры в bottom sheet / сайдбаре, чипсы активных фильтров,
 * слайдер цены) собирается на этапе 3 поверх того же CatalogProvider.
 */
export default function CatalogPage(props: PageProps<"/catalog">) {
  return (
    <div className="container-page py-6 lg:py-10">
      <h1 className="text-2xl font-bold lg:text-3xl">Каталог</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogListing searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const SORTS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "new", label: "Новинки" },
  { value: "price-asc", label: "Цена ↑" },
  { value: "price-desc", label: "Цена ↓" },
];

/** Быстрые разделы: корневые категории + склад в России. */
const SECTIONS = [
  { slug: undefined, label: "Все" },
  { slug: "man", label: "Мужское" },
  { slug: "woman", label: "Женское" },
  { slug: "shoes-man", label: "Обувь" },
  { slug: "accessories", label: "Аксессуары" },
  { slug: "bags-and-backpacks", label: "Сумки" },
  { slug: "warehouse-in-russia", label: "Из России" },
] as const;

function href(query: Partial<CatalogQuery>) {
  const qs = serializeCatalogQuery(query);
  const category = query.category ? `category=${encodeURIComponent(query.category)}` : "";
  if (!category) return `/catalog${qs}`;
  return `/catalog${qs ? `${qs}&${category}` : `?${category}`}`;
}

const chip =
  "inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150";
const chipOn = "border-foreground bg-foreground text-background";
const chipOff = "border-border-strong hover:border-foreground";

async function CatalogListing({
  searchParams,
}: {
  searchParams: PageProps<"/catalog">["searchParams"];
}) {
  const params = await searchParams;
  const rawCategory = params.category;
  const category = (Array.isArray(rawCategory) ? rawCategory[0] : rawCategory) || undefined;
  const query = parseCatalogParams(params, { category });

  const catalog = getCatalog();
  const [list, current] = await Promise.all([
    catalog.listProducts(query),
    category ? catalog.getCategory(category) : Promise.resolve(null),
  ]);

  return (
    <>
      <p className="mt-1 text-sm text-foreground-muted" aria-live="polite">
        {current ? `${current.name} · ` : ""}
        {list.total} {pluralize(list.total, ["товар", "товара", "товаров"])}
        {query.inStockOnly ? " в наличии" : ""}
      </p>

      <nav aria-label="Разделы каталога" className="-mx-4 mt-4 no-scrollbar overflow-x-auto px-4">
        <ul className="flex gap-2">
          {SECTIONS.map((s) => {
            const active = query.category === s.slug;
            return (
              <li key={s.label}>
                <Link
                  href={href({ ...query, category: s.slug, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={cn(chip, active ? chipOn : chipOff)}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav aria-label="Сортировка" className="-mx-4 no-scrollbar overflow-x-auto px-4">
          <ul className="flex gap-1">
            {SORTS.map((s) => {
              const active = query.sort === s.value;
              return (
                <li key={s.value}>
                  <Link
                    href={href({ ...query, sort: s.value, page: 1 })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex h-11 items-center rounded-md px-3 text-sm whitespace-nowrap",
                      active ? "font-semibold" : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link
          href={href({ ...query, inStockOnly: !query.inStockOnly, page: 1 })}
          className="inline-flex h-11 items-center gap-2 text-sm"
          aria-label={
            query.inStockOnly
              ? "Только в наличии: включено. Показать и распроданное"
              : "Только в наличии: выключено. Скрыть распроданное"
          }
        >
          <span
            aria-hidden
            className={cn(
              "relative inline-block h-5 w-8 rounded-full transition-colors duration-150",
              query.inStockOnly ? "bg-foreground" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-surface transition-transform duration-150",
                query.inStockOnly ? "translate-x-3.5" : "translate-x-0.5",
              )}
            />
          </span>
          Только в наличии
        </Link>
      </div>

      {list.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Здесь пока пусто"
          description="В этом разделе нет товаров в наличии. Покажем распроданное или весь каталог?"
          action={
            <>
              <Button asChild size="sm">
                <Link href="/catalog">Весь каталог</Link>
              </Button>
              {query.inStockOnly && (
                <Button asChild size="sm" variant="outline">
                  <Link href={href({ ...query, inStockOnly: false, page: 1 })}>
                    Показать распроданное
                  </Link>
                </Button>
              )}
            </>
          }
        />
      ) : (
        <ProductGrid className="mt-6">
          {list.items.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </ProductGrid>
      )}

      {list.pageCount > 1 && (
        <nav aria-label="Страницы" className="mt-10 flex items-center justify-center gap-4 text-sm">
          {list.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href({ ...query, page: list.page - 1 })}>← Назад</Link>
            </Button>
          ) : (
            <span className="w-[88px]" />
          )}
          <span className="text-foreground-muted tabular-nums">
            {list.page} из {list.pageCount}
          </span>
          {list.page < list.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href({ ...query, page: list.page + 1 })}>Дальше →</Link>
            </Button>
          ) : (
            <span className="w-[88px]" />
          )}
        </nav>
      )}
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mt-4">
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-surface-muted"
          />
        ))}
      </div>
      <div className="mt-6">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
