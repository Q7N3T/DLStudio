"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { clx } from "@medusajs/ui"
import type { ProductDetails } from "@lib/dl/product"
import { HowToMeasure, SizeChart } from "./size-chart"

interface DetailsProps {
  description: string | null
  details: ProductDetails
  shoes: boolean
}

/**
 * «Нижняя часть» карточки: Описание / Состав и уход / Замеры.
 * На телефоне по умолчанию раскрыто «Описание»; каждый блок — крупная зона нажатия.
 */
export function ProductDetailsAccordion({ description, details, shoes }: DetailsProps) {
  const paragraphs = (description ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const hasDescription = paragraphs.length > 0 || !!details.season || !!details.temperature
  const hasCare = details.composition.length > 0 || !!details.care || details.features.length > 0
  const hasChart = !!details.size_chart || details.model_params.length > 0

  const items = [
    hasDescription && "description",
    hasCare && "care",
    hasChart && "measures",
  ].filter(Boolean) as string[]
  if (!items.length) return null

  return (
    <Accordion.Root type="multiple" defaultValue={[items[0]]} className="border-t border-dl-border">
      {hasDescription && (
        <Item value="description" title="Описание">
          {details.season && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dl-fg-muted">{details.season}</p>}
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className={clx(/^[–—-]\s/.test(p) && "pl-3")}>
                {p}
              </p>
            ))}
          </div>
          {details.temperature && (
            <div className="mt-4 flex gap-3 rounded-md bg-dl-muted p-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden>
                <path d="M10 14.5V5a2 2 0 114 0v9.5a4 4 0 11-4 0z" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>
              <div>
                <p className="font-semibold">Температурный режим</p>
                <p className="text-dl-fg-muted">{details.temperature}</p>
              </div>
            </div>
          )}
        </Item>
      )}
      {hasCare && (
        <Item value="care" title="Состав и уход">
          {details.composition.length > 0 && (
            <dl className="space-y-1.5">
              {details.composition.map((line, i) => {
                const m = line.match(/^([^:]{2,30}):\s*(.+)$/)
                return m ? (
                  <div key={i} className="flex gap-2">
                    <dt className="shrink-0 font-semibold">{m[1]}:</dt>
                    <dd>{m[2]}</dd>
                  </div>
                ) : (
                  <div key={i}>
                    <dt className="sr-only">Состав</dt>
                    <dd>{line}</dd>
                  </div>
                )
              })}
            </dl>
          )}
          {details.features.length > 0 && (
            <dl className="mt-4 divide-y divide-dl-border border-y border-dl-border">
              {details.features.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 py-2">
                  <dt className="text-dl-fg-muted">{f.label}</dt>
                  <dd className="text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {details.care && (
            <div className="mt-4">
              <p className="font-semibold">Уход</p>
              <p className="mt-1 text-dl-fg-muted">{details.care}</p>
            </div>
          )}
        </Item>
      )}
      {hasChart && (
        <Item value="measures" title="Замеры">
          <SizeChart details={details} />
          <HowToMeasure shoes={shoes} />
        </Item>
      )}
    </Accordion.Root>
  )
}

function Item({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <Accordion.Item value={value} className="border-b border-dl-border">
      <Accordion.Header>
        <Accordion.Trigger className="group flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left text-base font-semibold">
          {title}
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden text-sm leading-6 data-[state=closed]:animate-accordion-close data-[state=open]:animate-accordion-open">
        <div className="pb-5">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
