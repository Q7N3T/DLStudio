import Link from "next/link";
import { cn } from "@/lib/utils";

/** Текстовый логотип: широкий акцидентный шрифт, как у текущего знака. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="DL Studio — на главную"
      className={cn(
        "inline-flex min-h-11 items-center font-display text-lg leading-none font-bold tracking-tight uppercase",
        className,
      )}
    >
      DL<span className="ml-1 font-medium">Studio</span>
    </Link>
  );
}
