import { Search } from "lucide-react";
import Link from "next/link";
import { mainNav } from "@/config/navigation";
import { GenderSwitch } from "./gender-switch";
import { HeaderActions } from "./header-actions";
import { Logo } from "./logo";
import { SearchTrigger } from "./search-trigger";

/**
 * Мобильная шапка — две строки: логотип + «Мужчинам/Женщинам» + трекинг, ниже поиск.
 * Десктоп — одна строка: логотип, переключатель, навигация, поиск, иконки.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:shadow-md"
      >
        Перейти к содержимому
      </a>
      <div className="container-page flex h-14 items-center gap-2 lg:h-[var(--header-height)] lg:gap-3 xl:gap-6">
        <Logo className="shrink-0" />
        <GenderSwitch size="sm" className="xl:hidden" />
        <GenderSwitch className="hidden xl:inline-flex" />
        <nav aria-label="Основное" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex h-11 items-center rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:bg-muted xl:px-3"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SearchTrigger className="ml-auto hidden max-w-sm min-w-0 flex-1 xl:flex" />
        <Link
          href="/search"
          aria-label="Поиск"
          className="ml-auto hidden size-11 items-center justify-center rounded-md transition-colors duration-150 hover:bg-muted lg:inline-flex xl:hidden"
        >
          <Search className="size-5" aria-hidden />
        </Link>
        <div className="-mr-2.5 ml-auto lg:mr-0 lg:ml-0">
          <HeaderActions />
        </div>
      </div>
      <div className="container-page pb-3 lg:hidden">
        <SearchTrigger />
      </div>
    </header>
  );
}
