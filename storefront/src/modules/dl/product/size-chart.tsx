"use client"

import { clx } from "@medusajs/ui"
import type { ProductDetails, SizeChart as SizeChartData } from "@lib/dl/product"
import { useEffect, useRef } from "react"

const SIZE_LIKE = /^(\d{2}(?:[.,]5)?|[2-4]?X{0,3}[SML]|XS|XXS|\d?XL|Единый)$/i

/**
 * У обуви на сайте размеры идут колонками (EU 35…44), а строки — US и сантиметры.
 * На телефоне это длинная горизонтальная таблица, поэтому разворачиваем её: размер = строка.
 */
export function normalizeChart(chart: SizeChartData): SizeChartData {
  const [corner, ...headers] = chart.columns
  const sizeHeaders = headers.filter((h) => SIZE_LIKE.test(h.trim())).length
  const sizeRows = chart.rows.filter((r) => SIZE_LIKE.test((r[0] ?? "").trim())).length
  if (headers.length < 3 || sizeHeaders < headers.length * 0.8 || sizeRows > 0) return chart
  return {
    columns: [corner || "Размер", ...chart.rows.map((r) => r[0] ?? "")],
    rows: headers.map((h, i) => [h, ...chart.rows.map((r) => r[i + 1] ?? "")]),
  }
}

/**
 * Таблица замеров товара (из product.metadata.details).
 * Ориентация как на сайте: у одежды размеры в строках, у обуви — в колонках.
 * Выбранный размер подсвечивается; таблица листается вбок, первая колонка закреплена.
 */
export function SizeChart({ details, selected, className }: { details: ProductDetails; selected?: string | null; className?: string }) {
  const selectedRow = useRef<HTMLTableRowElement>(null)
  // Выбранный размер всегда в зоне видимости (в bottom sheet таблица длиннее экрана)
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selected])
  const chart = details.size_chart ? normalizeChart(details.size_chart) : null
  if (!chart) return null
  const [corner, ...headers] = chart.columns
  const norm = (s: string | undefined | null) => (s ?? "").trim().toUpperCase()
  const selectedCol = selected ? headers.findIndex((h) => norm(h) === norm(selected)) : -1

  return (
    <div className={className}>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Замеры изделия, сантиметры</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-dl-surface py-2 pr-4 text-left text-xs font-semibold text-dl-fg-muted">
                {corner || "Размер"}
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={clx(
                    "whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-dl-fg-muted",
                    i === selectedCol && "rounded-t-md bg-dl-brand-soft text-dl-fg"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, r) => {
              const [head, ...cells] = row
              const rowSelected = !!selected && norm(head) === norm(selected)
              return (
                <tr key={r} ref={rowSelected ? selectedRow : undefined} className={clx(rowSelected && "bg-dl-brand-soft")}>
                  <th
                    scope="row"
                    className={clx(
                      "sticky left-0 z-10 whitespace-nowrap border-t border-dl-border py-2.5 pr-4 text-left font-semibold",
                      rowSelected ? "bg-dl-brand-soft" : "bg-dl-surface"
                    )}
                  >
                    {head}
                  </th>
                  {cells.map((c, i) => (
                    <td
                      key={i}
                      className={clx(
                        "whitespace-nowrap border-t border-dl-border px-3 py-2.5 tabular-nums",
                        i === selectedCol && "bg-dl-brand-soft font-semibold"
                      )}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {details.size_chart_note && <p className="mt-3 text-sm text-dl-fg-muted">{details.size_chart_note}</p>}
      {details.model_params.length > 0 && (
        <div className="mt-4 rounded-md bg-dl-muted p-3 text-sm">
          <p className="font-semibold">Параметры моделей на фото</p>
          <ul className="mt-1 space-y-0.5 text-dl-fg-muted">
            {details.model_params.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Подсказка для обуви и одежды без таблицы */
export function HowToMeasure({ shoes }: { shoes: boolean }) {
  return (
    <div className="mt-4 text-sm">
      <p className="font-semibold">Как измерить</p>
      {shoes ? (
        <p className="mt-1 text-dl-fg-muted">
          Встаньте на лист бумаги, отметьте пятку и самый длинный палец и измерьте расстояние. Вечером стопа чуть больше —
          меряйте вечером. Сравните с длиной в таблице.
        </p>
      ) : (
        <p className="mt-1 text-dl-fg-muted">
          Разложите похожую вещь из своего гардероба и измерьте её: ширину груди, плечи, рукав и длину. Сравните с цифрами в
          таблице — так надёжнее, чем по буквам размера.
        </p>
      )}
    </div>
  )
}
