import { Metadata } from "next"
import Link from "next/link"
import { listStudios } from "@lib/data/studios"

export const metadata: Metadata = {
  title: "Студии",
  description: "Независимые студии из Китая, с которыми работает DL Studio напрямую.",
}

export default async function StudiosPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const studios = await listStudios()
  return (
    <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_1.5rem)] pt-4 lg:!px-6 lg:pt-6">
      <h1 className="text-2xl font-bold lg:text-3xl">Студии</h1>
      <p className="mt-1 max-w-xl text-sm text-dl-fg-muted">
        Работаем напрямую с производителями — без посредников и перепродажи.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {studios.map((s) => (
          <li key={s.handle}>
            <Link
              href={`/${countryCode}/studios/${s.handle}`}
              className="flex min-h-[88px] flex-col justify-between rounded-md border border-dl-border bg-dl-surface p-4 transition-colors hover:border-dl-fg"
            >
              <span className="font-display text-sm font-bold uppercase leading-5">{s.name}</span>
              <span className="mt-2 text-xs text-dl-fg-muted">Смотреть товары →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
