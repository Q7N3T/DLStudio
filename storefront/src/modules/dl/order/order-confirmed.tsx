import { deliveryOrigin, DELIVERY } from "@lib/dl/delivery"
import { formatPrice, pluralize } from "@lib/dl/format"
import { formatPhone } from "@lib/dl/phone"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import Link from "next/link"
import { SUPPORT_TELEGRAM } from "../product/delivery-trust"

/** Подтверждение заказа: номер крупно, что будет дальше, состав и адрес */
export function OrderConfirmed({ order, countryCode }: { order: HttpTypes.StoreOrder; countryCode: string }) {
  const items = order.items ?? []
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const addr = order.shipping_address
  const method = order.shipping_methods?.[0]
  const fromChina = items.some((i) => deliveryOrigin(i.product?.metadata as Record<string, unknown> | undefined) === "china")
  const prep = fromChina ? DELIVERY.china : DELIVERY.russia

  return (
    <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_2rem)] pt-6 lg:!px-6 lg:pb-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-dl-success-soft text-dl-success" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-7 w-7">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="mt-4 text-2xl font-bold lg:text-3xl">Заказ оформлен</h1>
          <p className="mt-2 text-dl-fg-muted">
            {addr?.first_name ? `Спасибо, ${addr.first_name}! ` : "Спасибо! "}
            Номер заказа <span className="font-bold text-dl-fg tabular-nums">№{order.display_id}</span> — назовите его, если напишете нам.
          </p>
        </div>

        <section aria-labelledby="next-steps" className="mt-6 rounded-lg bg-dl-surface p-4 ring-1 ring-dl-border lg:p-6">
          <h2 id="next-steps" className="text-lg font-bold">Что дальше</h2>
          <ol className="mt-3 space-y-3 text-sm">
            <Step n={1} title="Соберём заказ">
              {fromChina
                ? `Товары из Китая отправим по России за ${prep.minDays}–${prep.maxDays} ${pluralize(prep.maxDays, ["день", "дня", "дней"])}.`
                : `Отправим со склада в России за ${prep.minDays}–${prep.maxDays} ${pluralize(prep.maxDays, ["день", "дня", "дней"])}.`}
            </Step>
            <Step n={2} title={`Передадим ${method?.name ? `в ${method.name}` : "в доставку"}`}>
              Свяжемся по номеру {addr?.phone ? formatPhone(addr.phone) : "из заказа"}, если понадобится что-то уточнить.
            </Step>
            <Step n={3} title="Получите посылку">
              {addr ? [addr.postal_code, addr.city, addr.address_1].filter(Boolean).join(", ") : "По адресу из заказа"}
            </Step>
          </ol>
        </section>

        <section aria-labelledby="order-items" className="mt-4 rounded-lg bg-dl-surface p-4 ring-1 ring-dl-border lg:p-6">
          <h2 id="order-items" className="text-lg font-bold">
            {count} {pluralize(count, ["товар", "товара", "товаров"])}
          </h2>
          <ul className="mt-3 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3">
                <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-dl-muted">
                  {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="line-clamp-2 font-medium">{i.product_title}</span>
                  <span className="block text-xs text-dl-fg-muted">
                    {[i.variant_title !== "Default variant" ? i.variant_title : null, `${i.quantity} шт.`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(i.total ?? (i.unit_price ?? 0) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-dl-border pt-4 text-sm">
            <Row label="Товары" value={formatPrice(order.item_subtotal ?? order.item_total)} />
            {(order.discount_total ?? 0) > 0 && <Row label="Скидка" value={`−${formatPrice(order.discount_total)}`} accent />}
            <Row label={method?.name ? `Доставка, ${method.name}` : "Доставка"} value={order.shipping_total ? formatPrice(order.shipping_total) : "бесплатно"} />
            <div className="flex items-baseline justify-between border-t border-dl-border pt-3">
              <dt className="font-bold">Итого</dt>
              <dd className="text-xl font-bold tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href={`/${countryCode}/store`} className="flex h-12 items-center justify-center rounded-md bg-dl-fg px-4 font-semibold text-dl-bg">
            Продолжить покупки
          </Link>
          <a
            href={SUPPORT_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-md border border-dl-border-strong px-4 font-semibold hover:bg-dl-muted"
          >
            Вопрос по заказу
          </a>
        </div>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-dl-muted text-xs font-bold" aria-hidden>
        {n}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-dl-fg-muted">{children}</span>
      </span>
    </li>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-dl-fg-muted">{label}</dt>
      <dd className={accent ? "tabular-nums text-dl-success" : "tabular-nums"}>{value}</dd>
    </div>
  )
}
