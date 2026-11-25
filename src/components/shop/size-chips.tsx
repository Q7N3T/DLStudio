"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { SizeOption } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface SizeChipsProps {
  sizes: SizeOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  /** Подпись группы для скринридера */
  label?: string;
  className?: string;
}

/**
 * Размеры как на Маркете: чипсы; отсутствующие видны, но зачёркнуты и неактивны.
 * Radix RadioGroup: стрелки переключают выбор, Tab — в группу и из неё.
 */
export function SizeChips({
  sizes,
  value,
  onValueChange,
  label = "Размер",
  className,
}: SizeChipsProps) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      value={value ?? ""}
      onValueChange={onValueChange}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {sizes.map((s) => (
        <RadioGroupPrimitive.Item
          key={s.value}
          value={s.value}
          disabled={!s.inStock}
          aria-label={s.inStock ? s.value : `${s.value}, нет в наличии`}
          className={cn(
            "inline-flex h-11 min-w-12 items-center justify-center rounded-md border border-border-strong bg-surface px-3 text-sm font-semibold tabular-nums transition-colors duration-150",
            "hover:border-foreground",
            "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-foreground-muted disabled:line-through disabled:hover:border-border",
          )}
        >
          {s.value}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/** Строка доступных размеров в карточке каталога: «S M L XL». */
export function SizeLine({ sizes, className }: { sizes: SizeOption[]; className?: string }) {
  const available = sizes.filter((s) => s.inStock);
  if (available.length === 0) return null;
  return (
    <p className={cn("truncate text-xs text-foreground-muted tabular-nums", className)}>
      <span className="sr-only">В наличии размеры: </span>
      {available.map((s) => s.value).join(" · ")}
    </p>
  );
}
