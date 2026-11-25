"use client"

import { addToCart, deleteLineItem, updateLineItem } from "@lib/data/cart"
import { applyPromotion, removePromotion } from "@lib/data/dl-cart"
import { exceedsStock, FREE_SHIPPING_FROM, groupByOrigin, itemsCount, itemsSubtotal, maxQuantity, type CartItem, type StockMap } from "@lib/dl/cart"
import { deliveryWindow } from "@lib/dl/delivery"
import { discountPercent, formatPrice, pluralize } from "@lib/dl/format"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { DeliveryBadge } from "../ui/badge"

const productsWord = (n: number) => pluralize(n, ["товар", "товара", "товаров"])

export function CartView({ cart, countryCode, stock }: { cart: HttpTypes.StoreCart | null; countryCode: string; stock: StockMap }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyLine, setBusyLine] = useState<string | null>(null)
  const [removed, setRemoved] = useState<{ variantId: string; title: string; quantity: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const time = (d: string | Date | null | undefined) => (d ? new Date(d).getTime() : 0)
  const items = [...(cart?.items ?? [])].sort((a, b) => time(a.created_at) - time(b.created_at))
  const count = itemsCount(cart)

  const refresh = () => {
    notifyCartUpdated()
    startTransition(() => router.refresh())
  }

  const setQty = async (item: CartItem, quantity: number) => {
    setBusyLine(item.id)
    setError(null)
    try {
      await updateLineItem({ lineId: item.id, quantity })
      refresh()
    } catch {
      setError("Не получилось изменить количество — возможно, столько нет в наличии.")
    } finally {
      setBusyLine(null)
    }
  }

  const remove = async (item: CartItem) => {
    setBusyLine(item.id)
    setError(null)
    try {
      await deleteLineItem(item.id)
      setRemoved({ variantId: item.variant_id!, title: item.product_title ?? "Товар", quantity: item.quantity })
      refresh()
    } catch {
      setError("Не получилось удалить товар. Попробуйте ещё раз.")
    } finally {
      setBusyLine(null)
    }
  }

  const undo = async () => {
    if (!removed) return
    const r = removed
    setRemoved(null)
    await addToCart({ variantId: r.variantId, quantity: r.quantity, countryCode })
    refresh()
  }

  if (!cart || items.length === 0) {
    return (
      <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_2rem)] pt-4 lg:!px-6">
        <h1 className="text-2xl font-bold lg:text-3xl">Корзина</h1>
        {removed && <UndoToast title={removed.title} onUndo={undo} onClose={() => setRemoved(null)} />}
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-dl-muted" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path d="M5 7h14l-1.2 12.1a1 1 0 01-1 .9H7.2a1 1 0 01-1-.9zM9 7V6a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.7" fill="none" />
            </svg>
          </span>
          <h2 className="text-lg font-bold">В корзине пусто</h2>
          <p className="mt-2 text-sm text-dl-fg-muted">Загляните в каталог или в избранное — вдруг там уже лежит то самое.</p>
          <div className="mt-6 flex gap-3">
            <Link href={`/${countryCode}/store`} className="inline-flex h-11 items-center rounded-md bg-dl-fg px-5 text-sm font-semibold text-white">
              В каталог
            </Link>
            <Link href={`/${countryCode}/favorites`} className="inline-flex h-11 items-center rounded-md border border-dl-border-strong px-5 text-sm font-semibold">
              Избранное
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = itemsSubtotal(cart)
  const discount = cart.discount_total ?? 0
  const total = Math.max(0, subtotal - discount)
  const groups = groupByOrigin(items)
  const checkoutHref = `/${countryCode}/checkout`

  return (
    <div className="content-container !px-4 pb-[calc(var(--dl-tabbar-h)_+_6.5rem)] pt-4 lg:!px-6 lg:pb-16 lg:pt-6">
      <h1 className="text-2xl font-bold lg:text-3xl">
        Корзина <span className="text-dl-fg-muted">· {count}</span>
      </h1>

      <div className="mt-4 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
        <div className={clx("min-w-0 transition-opacity", pending && "opacity-60")}>
          <FreeShippingProgress subtotal={subtotal} />

          {groups.map((g) => (
            <section key={g.origin} aria-label={g.origin === "russia" ? "Из России" : "Из Китая"} className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DeliveryBadge origin={g.origin} />
                <p className="text-sm text-dl-fg-muted">
                  Привезём <span className="font-semibold text-dl-fg">{deliveryWindow(g.origin)}</span>
                </p>
              </div>
              <ul className="mt-2 divide-y divide-dl-border border-y border-dl-border">
                {g.items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    countryCode={countryCode}
                    stock={stock}
                    busy={busyLine === item.id}
                    onQty={(q) => setQty(item, q)}
                    onRemove={() => remove(item)}
                  />
                ))}
              </ul>
            </section>
          ))}

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-dl-danger-soft p-3 text-sm text-dl-danger">
              {error}
            </p>
          )}
          {removed && <UndoToast title={removed.title} onUndo={undo} onClose={() => setRemoved(null)} />}
        </div>

        <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
          <div className="rounded-md border border-dl-border bg-dl-surface p-4">
            <PromoCode promotions={cart.promotions ?? []} onChanged={refresh} />
            <dl className="mt-4 space-y-2 border-t border-dl-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-dl-fg-muted">
                  {count} {productsWord(count)}
                </dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-dl-brand-strong">
                  <dt>Скидка по промокоду</dt>
                  <dd className="tabular-nums">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-dl-fg-muted">Доставка</dt>
                <dd>{subtotal >= FREE_SHIPPING_FROM ? <span className="font-semibold text-dl-success">Бесплатно</span> : "от 390 ₽ — выберете дальше"}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-dl-border pt-3 text-base">
                <dt className="font-bold">Итого</dt>
                <dd className="text-xl font-bold tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Link
              href={checkoutHref}
              className="mt-4 hidden h-[52px] w-full items-center justify-center rounded-md bg-dl-fg text-base font-semibold text-white hover:bg-dl-fg/85 lg:flex"
            >
              Оформить заказ
            </Link>
            <p className="mt-3 text-xs text-dl-fg-muted">
              Можно оформить без регистрации. Вопросы —{" "}
              <a href="https://t.me/dlstudiosupport" target="_blank" rel="noopener noreferrer" className="underline">
                в Telegram
              </a>
              , ответим за ~5 минут.
            </p>
          </div>
        </aside>
      </div>

      {/* Телефон: итог и кнопка над таб-баром */}
      <div className="fixed inset-x-0 bottom-[calc(var(--dl-tabbar-h)_+_env(safe-area-inset-bottom))] z-40 border-t border-dl-border bg-dl-surface/95 px-4 py-2.5 shadow-dl-up backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold tabular-nums leading-6">{formatPrice(total)}</p>
            <p className="truncate text-xs text-dl-fg-muted">
              {count} {productsWord(count)}
              {discount > 0 ? ` · скидка ${formatPrice(discount)}` : ""}
            </p>
          </div>
          <Link href={checkoutHref} className="inline-flex h-12 w-[55%] items-center justify-center rounded-md bg-dl-fg text-sm font-semibold text-white">
            Оформить заказ
          </Link>
        </div>
      </div>
    </div>
  )
}

function CartLine({
  item,
  countryCode,
  stock,
  busy,
  onQty,
  onRemove,
}: {
  item: CartItem
  countryCode: string
  stock: StockMap
  busy: boolean
  onQty: (q: number) => void
  onRemove: () => void
}) {
  const max = maxQuantity(item, stock)
  const unit = item.unit_price ?? 0
  const regular = (item as CartItem & { compare_at_unit_price?: number | null }).compare_at_unit_price ?? unit
  const onSale = regular > unit
  const href = `/${countryCode}/products/${item.product_handle}`
  const title = item.product_title ?? item.title
  const m = title.match(/[«“"](.+?)[»”"]?\s*$/)
  const shortTitle = m?.[1] ?? title
  const outOfStock = exceedsStock(item, stock)

  return (
    <li className={clx("flex gap-3 py-4 transition-opacity", busy && "opacity-50")}>
      <Link href={href} className="relative h-[120px] w-[90px] shrink-0 overflow-hidden rounded-md bg-dl-muted">
        {item.thumbnail && <Image src={item.thumbnail} alt={shortTitle} fill sizes="90px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0">
            <p className="line-clamp-2 text-sm leading-5">{shortTitle}</p>
            <p className="mt-0.5 text-xs text-dl-fg-muted">
              {[item.product_subtitle, item.variant_title !== "Default variant" ? item.variant_title : null].filter(Boolean).join(" · ")}
            </p>
          </Link>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={`Удалить «${shortTitle}»`}
            className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dl-fg-muted hover:bg-dl-muted hover:text-dl-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div role="group" aria-label={`Количество: ${shortTitle}`} className="inline-flex items-center rounded-md border border-dl-border-strong">
            <button
              type="button"
              onClick={() => (item.quantity <= 1 ? onRemove() : onQty(item.quantity - 1))}
              disabled={busy}
              aria-label={item.quantity <= 1 ? "Удалить" : "Уменьшить"}
              className="inline-flex h-11 w-11 items-center justify-center disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <output aria-live="polite" className="w-7 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </output>
            <button
              type="button"
              onClick={() => onQty(item.quantity + 1)}
              disabled={busy || item.quantity >= max}
              aria-label="Увеличить"
              className="inline-flex h-11 w-11 items-center justify-center disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="text-right">
            <p className={clx("font-bold tabular-nums", onSale && "text-dl-brand-strong")}>{formatPrice(unit * item.quantity)}</p>
            {onSale && (
              <p className="text-xs text-dl-fg-muted">
                <s className="tabular-nums">{formatPrice(regular * item.quantity)}</s> −{discountPercent(unit, regular)}%
              </p>
            )}
            {item.quantity > 1 && !onSale && <p className="text-xs text-dl-fg-muted tabular-nums">{formatPrice(unit)} / шт.</p>}
          </div>
        </div>
        {item.quantity >= max && max < 10 && (
          <p className="mt-1 text-xs font-semibold text-dl-brand-strong">{max === 1 ? "Последний в наличии" : `В наличии только ${max}`}</p>
        )}
        {outOfStock && <p className="mt-1 text-xs font-semibold text-dl-danger">Столько нет в наличии — уменьшите количество</p>}
      </div>
    </li>
  )
}

function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const left = Math.max(0, FREE_SHIPPING_FROM - subtotal)
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_FROM) * 100))
  return (
    <div className="rounded-md bg-dl-surface p-3 ring-1 ring-dl-border">
      <p className="text-sm">
        {left > 0 ? (
          <>
            До бесплатной доставки <span className="font-bold tabular-nums">{formatPrice(left)}</span>
          </>
        ) : (
          <span className="font-semibold text-dl-success">Доставка будет бесплатной</span>
        )}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-dl-muted"
        role="progressbar"
        aria-label="Прогресс до бесплатной доставки"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={clx("h-full rounded-full transition-[width] duration-300", left > 0 ? "bg-dl-brand" : "bg-dl-success")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PromoCode({ promotions, onChanged }: { promotions: { code?: string | null }[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const codes = promotions.map((p) => p.code).filter((c): c is string => !!c)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await applyPromotion(code)
    setLoading(false)
    if (err) return setError(err)
    setCode("")
    setOpen(false)
    onChanged()
  }

  return (
    <div>
      {codes.map((c) => (
        <div key={c} className="mb-2 flex items-center justify-between gap-2 rounded-md bg-dl-success-soft px-3 py-2 text-sm">
          <span>
            Промокод <span className="font-bold">{c}</span> применён
          </span>
          <button
            type="button"
            onClick={async () => {
              await removePromotion(c)
              onChanged()
            }}
            className="min-h-[44px] px-1 text-xs font-semibold underline underline-offset-4"
          >
            Убрать
          </button>
        </div>
      ))}
      {!open && codes.length === 0 ? (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-[44px] items-center gap-2 text-sm font-semibold">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M3 10V5h5l11 11-5 5L3 10zM7.5 7.5h.01" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Есть промокод?
        </button>
      ) : (
        codes.length === 0 && (
          <form onSubmit={submit} className="flex gap-2">
            <label className="sr-only" htmlFor="promo">
              Промокод
            </label>
            <input
              id="promo"
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(null)
              }}
              placeholder="Например, AUTUMN"
              aria-invalid={!!error}
              aria-describedby={error ? "promo-error" : undefined}
              className={clx(
                "h-11 min-w-0 flex-1 rounded-md border bg-dl-surface px-3 text-sm uppercase outline-none focus:border-dl-fg",
                error ? "border-dl-danger" : "border-dl-border-strong"
              )}
            />
            <button type="submit" disabled={loading || !code.trim()} className="h-11 rounded-md bg-dl-fg px-4 text-sm font-semibold text-white disabled:opacity-40">
              {loading ? "…" : "Применить"}
            </button>
          </form>
        )
      )}
      {error && (
        <p id="promo-error" role="alert" className="mt-2 text-sm text-dl-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function UndoToast({ title, onUndo, onClose }: { title: string; onUndo: () => void; onClose: () => void }) {
  const m = title.match(/[«“"](.+?)[»”"]?\s*$/)
  return (
    <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-md bg-dl-fg px-4 py-3 text-sm text-white">
      <span className="min-w-0 truncate">Удалили «{m?.[1] ?? title}»</span>
      <span className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onUndo} className="min-h-[44px] px-2 font-semibold underline underline-offset-4">
          Вернуть
        </button>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="inline-flex h-11 w-11 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </span>
    </div>
  )
}
