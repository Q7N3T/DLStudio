import Link from "next/link"
import { SUPPORT_TELEGRAM } from "../product/delivery-trust"

const SUPPORT_VK = "https://vk.me/dlstudioshop"

const GROUPS = [
  {
    title: "Покупателям",
    links: [
      { href: "/shipping", label: "Доставка" },
      { href: "/returns", label: "Возврат и обмен" },
      { href: "/account/orders", label: "Мои заказы" },
      { href: "/contact", label: "Контакты" },
    ],
  },
  {
    title: "DL Studio",
    links: [
      { href: "/studios", label: "Студии" },
      { href: "/terms", label: "Условия" },
      { href: "/privacy", label: "Конфиденциальность" },
    ],
  },
]

export function SiteFooter({ countryCode }: { countryCode: string }) {
  return (
    <footer className="mt-12 border-t border-dl-border bg-dl-surface pb-[calc(var(--dl-tabbar-h)_+_env(safe-area-inset-bottom))] lg:pb-0">
      <div className="content-container grid gap-10 !px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr] lg:!px-6 lg:py-14">
        <div className="max-w-sm">
          <p className="font-display text-lg font-bold uppercase">
            DL<span className="ml-1 font-medium">Studio</span>
          </p>
          <p className="mt-3 text-sm text-dl-fg-muted">
            Одежда и аксессуары независимых студий из Китая — напрямую от производителей. Индивидуальность интереснее, чем тренды.
          </p>
          <p className="mt-6 text-sm font-semibold">Есть вопрос?</p>
          <p className="mt-1 text-sm text-dl-fg-muted">Операторы дерутся за возможность помочь вам.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: SUPPORT_TELEGRAM, label: "Telegram" },
              { href: SUPPORT_VK, label: "ВКонтакте" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-md border border-dl-border-strong px-4 text-sm font-semibold hover:border-dl-fg"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-xs font-bold uppercase tracking-wider text-dl-fg-muted">{g.title}</p>
            <ul className="mt-2">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={`/${countryCode}${l.href}`} className="inline-flex min-h-[44px] items-center text-sm hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-dl-border">
        <p className="content-container !px-4 py-5 text-xs text-dl-fg-muted lg:!px-6">© DL Studio</p>
      </div>
    </footer>
  )
}
