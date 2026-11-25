"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  "aria-label": string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Сегментированный контрол (одиночный выбор, нельзя снять выбор).
 * Radix ToggleGroup даёт навигацию стрелками и role="radio"-подобную семантику.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = "md",
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={aria["aria-label"]}
      className={cn("inline-flex rounded-md bg-surface-muted p-0.5", className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            "flex-1 rounded-[calc(var(--radius)-1px)] font-semibold whitespace-nowrap text-foreground-muted transition-colors duration-150",
            "hover:text-foreground data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            // Визуально компактно, но зона нажатия ≥ 44px за счёт before-элемента
            "relative before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']",
            size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-4 text-sm",
          )}
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
