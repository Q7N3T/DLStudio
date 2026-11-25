"use client"

import { clx } from "@medusajs/ui"
import { countCatalog, type CatalogFacets, type CatalogScope } from "@lib/data/catalog"
import { activeCount, emptyFilters, serializeFilters, SORTS, type CatalogFilters } from "@lib/dl/catalog-query"
import { DELIVERY } from "@lib/dl/delivery"
import { formatPrice, pluralize } from "@lib/dl/format"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { BottomSheet } from "../ui/bottom-sheet"
import { FiltersPanel, type FilterLabels } from "./filters-panel"

interface ControlsProps {
  basePath: string
  scope: CatalogScope
  filters: CatalogFilters
  facets: CatalogFacets
  total: number
  labels: FilterLabels
  subcategories: { handle: string; name: string }[]
}

const productsWord = (n: number) => pluralize(n, ["товар", "товара", "товаров"])

/** Переход на новые фильтры: URL — единственный источник правды */
function useApply(basePath: string) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const apply = (f: CatalogFilters) =>
    start(() => {
      router.push(`${basePath}${serializeFilters({ ...f, page: 1 })}`, { scroll: false })
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  return { apply, pending }
}

/** Телефон: закреплённая панель «Фильтры · Сортировка», шторки и чипсы активных фильтров */
export function CatalogControls(props: ControlsProps) {
  const { basePath, scope, filters, facets, total, labels, subcategories } = props
  const { apply, pending } = useApply(basePath)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const [draftCount, setDraftCount] = useState<number | null>(total)
  const n = activeCount(filters)

  // Живой счётчик «Показать N товаров» при изменении черновика фильтров
  useEffect(() => {
    if (!filtersOpen) return
    let cancelled = false
    const t = setTimeout(() => {
      countCatalog(scope, draft)
        .then((c) => !cancelled && setDraftCount(c))
        .catch(() => !cancelled && setDraftCount(null))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [draft, filtersOpen, scope])

  const openFilters = () => {
    setDraft(filters)
    setDraftCount(total)
    setFiltersOpen(true)
  }

  return (
    <>
      <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top))] z-30 -mx-4 border-b border-dl-border bg-dl-bg/95 px-4 py-2 backdrop-blur lg:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openFilters}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-dl-border-strong bg-dl-surface text-sm font-semibold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="16" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
            Фильтры
            {n > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-dl-fg px-1.5 text-xs text-white">{n}</span>}
          </button>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 truncate rounded-md border border-dl-border-strong bg-dl-surface px-2 text-sm font-semibold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
              <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
            <span className="truncate">{SORTS.find((s) => s.value === filters.sort)?.label}</span>
          </button>
        </div>
      </div>

      <ActiveChips filters={filters} labels={labels} onChange={apply} />

      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Фильтры"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft({ ...emptyFilters(), sort: draft.sort, q: draft.q })}
              className="h-12 rounded-md border border-dl-border-strong px-4 text-sm font-semibold"
            >
              Сбросить
            </button>
            <button
              type="button"
              disabled={draftCount === 0}
              onClick={() => {
                setFiltersOpen(false)
                apply(draft)
              }}
              className="h-12 flex-1 rounded-md bg-dl-fg text-sm font-semibold text-white disabled:opacity-40"
            >
              {draftCount === null
                ? "Показать"
                : draftCount === 0
                  ? "Ничего не найдено"
                  : `Показать ${draftCount} ${productsWord(draftCount)}`}
            </button>
          </div>
        }
      >
        <FiltersPanel filters={draft} facets={facets} labels={labels} subcategories={subcategories} onChange={setDraft} />
      </BottomSheet>

      <BottomSheet open={sortOpen} onOpenChange={setSortOpen} title="Сортировка">
        <ul role="radiogroup" aria-label="Сортировка" className="pb-2">
          {SORTS.map((s) => {
            const on = s.value === filters.sort
            return (
              <li key={s.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setSortOpen(false)
                    apply({ ...filters, sort: s.value })
                  }}
                  className="flex min-h-[52px] w-full items-center justify-between border-b border-dl-border text-left text-base"
                >
                  <span className={clx(on && "font-semibold")}>{s.label}</span>
                  <span aria-hidden className={clx("h-5 w-5 rounded-full border-2", on ? "border-[6px] border-dl-fg" : "border-dl-border-strong")} />
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>

      {pending && <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 animate-pulse bg-dl-brand" aria-hidden />}
    </>
  )
}

/** Десктоп: фильтры в колонке слева применяются сразу */
export function CatalogSidebar(props: Omit<ControlsProps, "total" | "scope">) {
  const { apply } = useApply(props.basePath)
  return (
    <aside aria-label="Фильтры" className="sticky top-24 hidden max-h-[calc(100vh_-_7rem)] overflow-y-auto pr-2 lg:block">
      <FiltersPanel filters={props.filters} facets={props.facets} labels={props.labels} subcategories={props.subcategories} onChange={apply} />
    </aside>
  )
}

/** Десктоп: сортировка над сеткой */
export function DesktopSort({ basePath, filters }: { basePath: string; filters: CatalogFilters }) {
  const { apply } = useApply(basePath)
  return (
    <label className="hidden items-center gap-2 text-sm lg:flex">
      <span className="text-dl-fg-muted">Сортировка:</span>
      <select
        value={filters.sort}
        onChange={(e) => apply({ ...filters, sort: e.target.value as CatalogFilters["sort"] })}
        className="h-11 rounded-md border border-dl-border-strong bg-dl-surface px-3 font-semibold"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Чипсы активных фильтров с крестиком и «Сбросить всё» */
function ActiveChips({ filters: f, labels, onChange }: { filters: CatalogFilters; labels: FilterLabels; onChange: (f: CatalogFilters) => void }) {
  const chips: { key: string; label: string; remove: () => CatalogFilters }[] = []
  if (f.category) chips.push({ key: "cat", label: labels.categories[f.category] ?? f.category, remove: () => ({ ...f, category: undefined }) })
  for (const s of f.sizes) chips.push({ key: `size-${s}`, label: `Размер ${s}`, remove: () => ({ ...f, sizes: f.sizes.filter((x) => x !== s) }) })
  for (const c of f.colors) chips.push({ key: `color-${c}`, label: c, remove: () => ({ ...f, colors: f.colors.filter((x) => x !== c) }) })
  if (f.priceMin !== undefined || f.priceMax !== undefined)
    chips.push({
      key: "price",
      label: [f.priceMin !== undefined && `от ${formatPrice(f.priceMin)}`, f.priceMax !== undefined && `до ${formatPrice(f.priceMax)}`].filter(Boolean).join(" "),
      remove: () => ({ ...f, priceMin: undefined, priceMax: undefined }),
    })
  for (const d of f.delivery) chips.push({ key: `d-${d}`, label: DELIVERY[d].label, remove: () => ({ ...f, delivery: f.delivery.filter((x) => x !== d) }) })
  for (const s of f.studios) chips.push({ key: `s-${s}`, label: labels.studios[s] ?? s, remove: () => ({ ...f, studios: f.studios.filter((x) => x !== s) }) })
  if (!f.inStockOnly) chips.push({ key: "stock", label: "С распроданным", remove: () => ({ ...f, inStockOnly: true }) })
  if (f.q) chips.push({ key: "q", label: `«${f.q}»`, remove: () => ({ ...f, q: undefined }) })
  if (!chips.length) return null

  return (
    <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" aria-label="Выбранные фильтры">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.remove())}
          aria-label={`Убрать фильтр: ${c.label}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-dl-fg pl-3.5 pr-2.5 text-xs font-semibold text-white"
        >
          {c.label}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange({ ...emptyFilters(), sort: f.sort })}
          className="inline-flex h-9 shrink-0 items-center px-2 text-xs font-semibold underline underline-offset-4"
        >
          Сбросить всё
        </button>
      )}
    </div>
  )
}
