import { cn } from "@/lib/utils";

/** Счётчик на иконке (корзина, избранное). Скрыт, когда 0. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -top-1 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-strong px-1 text-2xs leading-none font-bold text-white tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
