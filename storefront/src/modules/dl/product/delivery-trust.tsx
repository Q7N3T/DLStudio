import { DELIVERY, deliveryWindow, type DeliveryOrigin } from "@lib/dl/delivery"
import { formatPrice } from "@lib/dl/format"
import Link from "next/link"
import { DeliveryBadge } from "../ui/badge"

/** Тарифы доставки по России — синхронно с backend/src/modules/dlstudio-shipping/tariffs.ts */
const SHIPPING_FROM = 390
const FREE_FROM = 15000
export const SUPPORT_TELEGRAM = "https://t.me/dlstudiosupport"

/** Блок «Когда привезём»: склад, примерная дата, стоимость доставки */
export function DeliveryBlock({ origin }: { origin: DeliveryOrigin }) {
  const d = DELIVERY[origin]
  return (
    <section aria-label="Доставка" className="rounded-md border border-dl-border bg-dl-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-dl-fg-muted">Привезём</p>
          <p className="text-lg font-bold">{deliveryWindow(origin)}</p>
        </div>
        <DeliveryBadge origin={origin} className="mt-1" />
      </div>
      <p className="mt-2 text-sm text-dl-fg-muted">{d.hint}</p>
      <p className="mt-3 border-t border-dl-border pt-3 text-sm">
        СДЭК или Почта России — от {formatPrice(SHIPPING_FROM)},{" "}
        <span className="font-semibold">бесплатно от {formatPrice(FREE_FROM)}</span>
      </p>
    </section>
  )
}

/** Доверие: оригинал, возврат, поддержка */
export function TrustBlock({ countryCode }: { countryCode: string }) {
  const item = "flex min-h-[44px] items-center gap-3 py-2"
  return (
    <ul className="divide-y divide-dl-border text-sm" aria-label="Гарантии">
      <li className={item}>
        <Icon d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM9 12l2 2 4-4" />
        <span>
          <span className="font-semibold">Оригинал от студии</span>
          <span className="block text-dl-fg-muted">Работаем напрямую с производителями, без посредников</span>
        </span>
      </li>
      <li>
        <Link href={`/${countryCode}/returns`} className={`${item} hover:underline`}>
          <Icon d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4" />
          <span>
            <span className="font-semibold">Обмен и возврат</span>
            <span className="block text-dl-fg-muted">Условия и сроки — коротко и по делу</span>
          </span>
        </Link>
      </li>
      <li>
        <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer" className={`${item} hover:underline`}>
          <Icon d="M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l8-6" />
          <span>
            <span className="font-semibold">Ответим в Telegram за ~5 минут</span>
            <span className="block text-dl-fg-muted">Операторы дерутся за возможность помочь вам</span>
          </span>
        </a>
      </li>
    </ul>
  )
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
