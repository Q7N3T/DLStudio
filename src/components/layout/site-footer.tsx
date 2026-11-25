import Link from "next/link";
import { footerNav } from "@/config/navigation";
import { site } from "@/config/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-10 md:grid-cols-[1.5fr_1fr_1fr] lg:py-14">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-foreground-muted">
            Одежда и аксессуары независимых студий из Китая — напрямую от производителей.
            Индивидуальность интереснее, чем тренды.
          </p>
          <div className="mt-6">
            <p className="text-sm font-semibold">Есть вопрос?</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Операторы дерутся за возможность помочь вам.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={site.support.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-md border border-border-strong px-4 text-sm font-semibold transition-colors duration-150 hover:border-foreground"
              >
                Telegram
              </a>
              <a
                href={site.support.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-md border border-border-strong px-4 text-sm font-semibold transition-colors duration-150 hover:border-foreground"
              >
                ВКонтакте
              </a>
            </div>
          </div>
        </div>
        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-xs font-bold tracking-wider text-foreground-muted uppercase">
              {group.title}
            </p>
            <ul className="mt-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-foreground-muted sm:flex-row sm:justify-between">
          <p>© DL Studio</p>
          {/* TODO: реквизиты продавца — уточнить у владельца */}
        </div>
      </div>
    </footer>
  );
}
