"use client"

import * as Slider from "@radix-ui/react-slider"
import { clx } from "@medusajs/ui"
import type { CatalogFacets } from "@lib/data/catalog"
import type { CatalogFilters } from "@lib/dl/catalog-query"
import { COLOR_SWATCH } from "@lib/dl/colors"
import { DELIVERY, deliveryBadge, type DeliveryOrigin } from "@lib/dl/delivery"
import { formatPrice } from "@lib/dl/format"
import { useState } from "react"

export interface FilterLabels {
  categories: Record<string, string>
  studios: Record<string, string>
}

interface FiltersPanelProps {
  filters: CatalogFilters
  facets: CatalogFacets
  labels: FilterLabels
  /** Подкатегории текущего раздела (для фильтра «Раздел») */
  subcategories: { handle: string; name: string }[]
  onChange: (next: CatalogFilters) => void
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/**
 * Фильтры каталога: раздел, размер, цвет, цена, студия, доставка, наличие.
 * Счётчики — из фасетов индекса; варианты без товаров показываются неактивными.
 */
export function FiltersPanel({ filters: f, facets, labels, subcategories, onChange }: FiltersPanelProps) {
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...f, ...patch, page: 1 })
  const count = (list: { value: string; count: number }[], v: string) => list.find((x) => x.value === v)?.count ?? 0

  const subs = subcategories
    .map((c) => ({ ...c, count: count(facets.categories, c.handle) }))
    .filter((c) => c.count > 0 || c.handle === f.category)

  return (
    <div className="divide-y divide-dl-border">
      {subs.length > 1 && (
        <Section title="Раздел">
          <div className="flex flex-wrap gap-2">
            {subs.map((c) => (
              <Pill key={c.handle} active={f.category === c.handle} onClick={() => set({ category: f.category === c.handle ? undefined : c.handle })}>
                {c.name}
                <Count n={c.count} />
              </Pill>
            ))}
          </div>
        </Section>
      )}

      <Section title="Наличие" inline>
        <Switch checked={f.inStockOnly} onChange={(v) => set({ inStockOnly: v })} label="Только в наличии" />
      </Section>

      {facets.sizes.length > 0 && (
        <Section title="Размер" hint={f.sizes.length ? `${f.sizes.length} выбрано` : undefined}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const active = f.sizes.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  disabled={!active && s.count === 0}
                  onClick={() => set({ sizes: toggle(f.sizes, s.value) })}
                  className={clx(
                    "inline-flex h-11 min-w-[48px] items-center justify-center rounded-md border px-3 text-sm font-semibold tabular-nums transition-colors",
                    active ? "border-dl-fg bg-dl-fg text-white" : "border-dl-border-strong bg-dl-surface hover:border-dl-fg",
                    "disabled:border-dl-border disabled:text-dl-fg-muted disabled:opacity-60"
                  )}
                >
                  {s.value}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Цвет">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = f.colors.includes(c.value)
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ colors: toggle(f.colors, c.value) })}
                  className={clx(
                    "inline-flex h-11 items-center gap-2 rounded-full border py-1 pl-1.5 pr-3 text-sm transition-colors",
                    active ? "border-dl-fg bg-dl-muted font-semibold" : "border-dl-border-strong hover:border-dl-fg"
                  )}
                >
                  <span aria-hidden className="h-7 w-7 rounded-full border border-black/10" style={{ background: COLOR_SWATCH[c.value] ?? "var(--dl-surface-muted)" }} />
                  {c.value}
                  <Count n={c.count} />
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {facets.price && facets.price.max > facets.price.min && (
        <Section title="Цена, ₽">
          <PriceRange
            key={`${f.priceMin ?? ""}-${f.priceMax ?? ""}-${facets.price.min}-${facets.price.max}`}
            bounds={facets.price}
            min={f.priceMin}
            max={f.priceMax}
            onCommit={(min, max) => set({ priceMin: min, priceMax: max })}
          />
        </Section>
      )}

      {facets.delivery.length > 0 && (
        <Section title="Доставка">
          <div className="grid gap-2">
            {(["russia", "china"] as DeliveryOrigin[]).map((d) => {
              const n = count(facets.delivery, d)
              const active = f.delivery.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  disabled={!active && n === 0}
                  onClick={() => set({ delivery: toggle(f.delivery, d) })}
                  className={clx(
                    "flex min-h-[56px] items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                    active ? "border-dl-fg bg-dl-muted" : "border-dl-border-strong hover:border-dl-fg",
                    "disabled:opacity-50"
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{deliveryBadge(d)}</span>
                    <span className="block text-xs text-dl-fg-muted">{d === "russia" ? "Склад в Москве, единичные размеры" : DELIVERY.china.hint.split(".")[0]}</span>
                  </span>
                  <Check on={active} />
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {facets.studios.length > 0 && (
        <Section title="Студия">
          <StudioList
            studios={facets.studios.map((s) => ({ ...s, name: labels.studios[s.value] ?? s.value }))}
            selected={f.studios}
            onToggle={(h) => set({ studios: toggle(f.studios, h) })}
          />
        </Section>
      )}
    </div>
  )
}

function Section({ title, hint, inline, children }: { title: string; hint?: string; inline?: boolean; children: React.ReactNode }) {
  return (
    <section className={clx("py-4", inline && "flex items-center justify-between gap-4")} aria-label={title}>
      <div className={clx("flex items-baseline justify-between gap-2", !inline && "mb-3")}>
        <h3 className="text-sm font-bold">{title}</h3>
        {hint && <span className="text-xs text-dl-fg-muted">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function Count({ n }: { n: number }) {
  return <span className="text-xs font-normal tabular-nums text-dl-fg-muted">{n}</span>
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clx(
        "inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
        active ? "border-dl-fg bg-dl-fg font-semibold text-white [&_span]:text-white/70" : "border-dl-border-strong hover:border-dl-fg"
      )}
    >
      {children}
    </button>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={clx("grid h-6 w-6 shrink-0 place-items-center rounded-md border-2", on ? "border-dl-fg bg-dl-fg text-white" : "border-dl-border-strong")}>
      {on && (
        <svg viewBox="0 0 24 24" className="h-4 w-4">
          <path d="M5 12l5 5 9-10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex min-h-[44px] items-center gap-3 text-sm">
      <span className="sr-only">{label}</span>
      {/* Размеры в px: пресет Medusa переопределяет шкалу отступов */}
      <span aria-hidden className={clx("relative inline-block h-[28px] w-[48px] rounded-full transition-colors duration-150", checked ? "bg-dl-fg" : "bg-dl-border-strong")}>
        <span
          className={clx(
            "absolute left-[4px] top-[4px] h-[20px] w-[20px] rounded-full bg-white shadow-dl-sm transition-transform duration-150",
            checked ? "translate-x-[20px]" : "translate-x-0"
          )}
        />
      </span>
    </button>
  )
}

function StudioList({
  studios,
  selected,
  onToggle,
}: {
  studios: { value: string; name: string; count: number }[]
  selected: string[]
  onToggle: (handle: string) => void
}) {
  const [all, setAll] = useState(false)
  const [q, setQ] = useState("")
  const sorted = [...studios].sort((a, b) => Number(selected.includes(b.value)) - Number(selected.includes(a.value)) || b.count - a.count)
  const filtered = q ? sorted.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) : sorted
  const visible = all || q ? filtered : filtered.slice(0, 6)
  return (
    <div>
      {studios.length > 8 && (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти студию"
          aria-label="Найти студию"
          className="mb-2 h-11 w-full rounded-md border border-dl-border-strong bg-dl-surface px-3 text-sm outline-none focus:border-dl-fg"
        />
      )}
      <ul>
        {visible.map((s) => {
          const on = selected.includes(s.value)
          return (
            <li key={s.value}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(s.value)} className="flex min-h-[44px] w-full items-center gap-3 text-left text-sm">
                <Check on={on} />
                <span className={clx("flex-1", on && "font-semibold")}>{s.name}</span>
                <Count n={s.count} />
              </button>
            </li>
          )
        })}
      </ul>
      {!q && filtered.length > 6 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 min-h-[44px] text-sm font-semibold underline underline-offset-4">
          {all ? "Свернуть" : `Показать все (${filtered.length})`}
        </button>
      )}
    </div>
  )
}

function PriceRange({
  bounds,
  min,
  max,
  onCommit,
}: {
  bounds: { min: number; max: number }
  min?: number
  max?: number
  onCommit: (min: number | undefined, max: number | undefined) => void
}) {
  const step = bounds.max - bounds.min > 20000 ? 1000 : 100
  const lo = Math.floor(bounds.min / step) * step
  const hi = Math.ceil(bounds.max / step) * step
  const [range, setRange] = useState<[number, number]>([min ?? lo, max ?? hi])
  // Внешние изменения (сброс фильтров) пересоздают компонент через key
  const [text, setText] = useState<[string, string]>([String(min ?? ""), String(max ?? "")])

  const commit = (a: number, b: number) => onCommit(a <= lo ? undefined : a, b >= hi ? undefined : b)
  const fromText = () => {
    const a = Number(text[0]) || lo
    const b = Number(text[1]) || hi
    const [x, y] = a > b ? [b, a] : [a, b]
    commit(Math.max(lo, x), Math.min(hi, y))
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {(["от", "до"] as const).map((label, i) => (
          <label key={label} className="flex h-11 flex-1 items-center gap-2 rounded-md border border-dl-border-strong bg-dl-surface px-3 focus-within:border-dl-fg">
            <span className="text-sm text-dl-fg-muted">{label}</span>
            <input
              inputMode="numeric"
              value={text[i]}
              placeholder={String(i ? hi : lo)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "")
                setText((t) => (i ? [t[0], v] : [v, t[1]]))
              }}
              onBlur={fromText}
              onKeyDown={(e) => e.key === "Enter" && fromText()}
              aria-label={`Цена ${label}`}
              className="w-full min-w-0 bg-transparent text-sm tabular-nums outline-none"
            />
          </label>
        ))}
      </div>
      <Slider.Root
        className="relative mt-5 flex h-6 touch-none select-none items-center"
        min={lo}
        max={hi}
        step={step}
        value={range}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => {
          setRange([v[0], v[1]])
          setText([String(v[0]), String(v[1])])
        }}
        onValueCommit={(v) => commit(v[0], v[1])}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-dl-border">
          <Slider.Range className="absolute h-full rounded-full bg-dl-fg" />
        </Slider.Track>
        {[0, 1].map((i) => (
          <Slider.Thumb
            key={i}
            aria-label={i ? "Максимальная цена" : "Минимальная цена"}
            className="block h-6 w-6 rounded-full border-2 border-dl-fg bg-white shadow-dl-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        ))}
      </Slider.Root>
      <p className="mt-2 flex justify-between text-xs tabular-nums text-dl-fg-muted">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </p>
    </div>
  )
}
