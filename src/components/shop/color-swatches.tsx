"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ColorOption } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface ColorSwatchesProps {
  colors: ColorOption[];
  value: string | null;
  onValueChange: (slug: string) => void;
  /** slug-и цветов, которых нет ни в одном размере */
  unavailable?: string[];
  className?: string;
}

export function ColorSwatches({
  colors,
  value,
  onValueChange,
  unavailable = [],
  className,
}: ColorSwatchesProps) {
  return (
    <RadioGroupPrimitive.Root
      aria-label="Цвет"
      value={value ?? ""}
      onValueChange={onValueChange}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {colors.map((c) => {
        const off = unavailable.includes(c.slug);
        return (
          <RadioGroupPrimitive.Item
            key={c.slug}
            value={c.slug}
            disabled={off}
            aria-label={off ? `${c.name}, нет в наличии` : c.name}
            title={c.name}
            className={cn(
              "relative inline-flex size-11 items-center justify-center rounded-full border border-transparent transition-colors duration-150",
              "hover:border-border-strong data-[state=checked]:border-foreground",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <span
              aria-hidden
              className="size-8 rounded-full border border-black/10"
              style={{ background: c.hex ?? "var(--surface-muted)" }}
            />
            {off && (
              <span aria-hidden className="absolute h-px w-9 rotate-45 bg-foreground-muted" />
            )}
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
