import Link from "next/link"

/** Оформление без отвлечений: только «назад в корзину», логотип и признак безопасности */
export default async function CheckoutLayout(props: { children: React.ReactNode; params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  return (
    <div className="min-h-dvh bg-dl-bg">
      <header className="sticky top-0 z-50 border-b border-dl-border bg-dl-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="content-container flex h-14 items-center justify-between !px-4 lg:!px-6">
          <Link href={`/${countryCode}/cart`} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold hover:bg-dl-muted">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Корзина
          </Link>
          <Link href={`/${countryCode}`} aria-label="DL Studio — на главную" className="font-display text-base font-bold uppercase">
            DL<span className="ml-1 font-medium">Studio</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-xs text-dl-fg-muted">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path d="M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Защищённое оформление</span>
          </span>
        </div>
      </header>
      <main id="main">{props.children}</main>
    </div>
  )
}
