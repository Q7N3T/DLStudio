"use client"

import { clx } from "@medusajs/ui"

export interface ChipOption {
  value: string
  label?: string
  /** Нет в наличии: виден, зачёркнут, неактивен */
  disabled?: boolean
}

interface ChipGroupProps {
  label: string
  options: ChipOption[]
  value: string | null
  onChange: (value: string) => void
  /** Подсветить группу, если пользователь пытался купить без выбора */
  invalid?: boolean
  className?: string
}

/**
 * Размеры/цвета чипсами, как на маркетплейсах. Семантика radiogroup:
 * стрелки переключают, Tab — в группу и из неё.
 */
export function ChipGroup({ label, options, value, onChange, invalid, className }: ChipGroupProps) {
  const enabled = options.filter((o) => !o.disabled)
  const move = (dir: 1 | -1) => {
    if (!enabled.length) return
    const i = enabled.findIndex((o) => o.value === value)
    const next = enabled[(i + dir + enabled.length) % enabled.length]
    onChange(next.value)
    requestAnimationFrame(() => document.getElementById(`chip-${label}-${next.value}`)?.focus())
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={clx("flex flex-wrap gap-2", invalid && "animate-[dl-shake_0.3s_ease-in-out]", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault()
          move(1)
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault()
          move(-1)
        }
      }}
    >
      {options.map((o) => {
        const checked = o.value === value
        return (
          <button
            key={o.value}
            id={`chip-${label}-${o.value}`}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-disabled={o.disabled || undefined}
            aria-label={o.disabled ? `${o.label ?? o.value}, нет в наличии` : undefined}
            tabIndex={checked || (!value && o === enabled[0]) ? 0 : -1}
            onClick={() => !o.disabled && onChange(o.value)}
            className={clx(
              "inline-flex h-11 min-w-[48px] items-center justify-center rounded-md border px-3 text-sm font-semibold tabular-nums transition-colors duration-150",
              checked && "border-dl-fg bg-dl-fg text-white",
              !checked && !o.disabled && "border-dl-border-strong bg-dl-surface hover:border-dl-fg",
              !checked && invalid && !o.disabled && "border-dl-brand-strong",
              o.disabled && "cursor-not-allowed border-dl-border bg-dl-muted text-dl-fg-muted line-through"
            )}
          >
            {o.label ?? o.value}
          </button>
        )
      })}
    </div>
  )
}
