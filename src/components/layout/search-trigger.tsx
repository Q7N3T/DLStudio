import { Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Поле-кнопка поиска. На этапе 3 откроет полноэкранный оверлей с подсказками;
 * пока ведёт на страницу поиска, чтобы работать без JS.
 */
export function SearchTrigger({ className }: { className?: string }) {
  return (
    <Link
      href="/search"
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-md bg-surface-muted px-3 text-sm text-foreground-muted transition-colors duration-150 hover:bg-border",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-foreground" aria-hidden />
      <span className="truncate">Найти куртку, студию или релиз</span>
    </Link>
  );
}
