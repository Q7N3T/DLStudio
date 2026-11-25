"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}

/** Количество — только в корзине (на карточке товара его нет по ТЗ). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
  className,
}: QuantityStepperProps) {
  const btn =
    "inline-flex size-11 items-center justify-center text-foreground transition-colors duration-150 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      aria-label={`Количество: ${label}`}
      className={cn("inline-flex items-center rounded-md border border-border-strong", className)}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Уменьшить"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="w-8 text-center text-sm font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Увеличить"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
