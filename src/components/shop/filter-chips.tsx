import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActiveFilter {
  key: string;
  label: string;
}

interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onReset: () => void;
  className?: string;
}

/** Активные фильтры над сеткой: каждый с крестиком, плюс «Сбросить всё». */
export function FilterChips({ filters, onRemove, onReset, className }: FilterChipsProps) {
  if (filters.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <ul className="contents" aria-label="Выбранные фильтры">
        {filters.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              onClick={() => onRemove(f.key)}
              aria-label={`Убрать фильтр: ${f.label}`}
              className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground pr-2.5 pl-3.5 text-xs font-semibold text-background transition-opacity duration-150 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:opacity-85"
            >
              {f.label}
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center px-2 text-xs font-semibold underline underline-offset-4"
        >
          Сбросить всё
        </button>
      )}
    </div>
  );
}
