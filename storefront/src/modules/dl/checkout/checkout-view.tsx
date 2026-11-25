"use client"

import { initiatePaymentSession, placeOrder, setShippingMethod } from "@lib/data/cart"
import { saveCheckoutAddress } from "@lib/data/dl-cart"
import { groupByOrigin, itemsCount, type CartItem } from "@lib/dl/cart"
import { DELIVERY } from "@lib/dl/delivery"
import { formatPrice, pluralize } from "@lib/dl/format"
import { formatPhone, isValidPhone, maskPhoneInput, toE164 } from "@lib/dl/phone"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState, useSyncExternalStore } from "react"

export interface CarrierOption {
  id: string
  code: string
  name: string
  description: string
  days: string
  amount: number | null
}

type FieldName = "first_name" | "last_name" | "phone" | "email" | "city" | "address_1" | "postal_code"
type Form = Record<FieldName, string>
type Errors = Partial<Record<FieldName | "carrier" | "payment" | "form", string>>

const FIELD_ORDER: FieldName[] = ["first_name", "last_name", "phone", "email", "city", "address_1", "postal_code"]
const DRAFT_KEY = "dl-checkout-contact"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PAYMENT_LABELS: Record<string, { title: string; hint: string }> = {
  pp_system_default: {
    title: "Тестовая оплата",
    hint: "Онлайн-оплата картой и СБП через ЮKassa подключается на следующем этапе. Сейчас заказ оформится без списания денег.",
  },
}

function initialForm(cart: HttpTypes.StoreCart): Form {
  const a = cart.shipping_address
  return {
    first_name: a?.first_name ?? "",
    last_name: a?.last_name ?? "",
    phone: a?.phone ? formatPhone(a.phone) : "",
    email: cart.email ?? "",
    city: a?.city ?? "",
    address_1: a?.address_1 ?? "",
    postal_code: a?.postal_code ?? "",
  }
}

/** Данные прошлого заказа с этого устройства (только localStorage, на сервер не уходят) */
function readDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY)
  } catch {
    return null
  }
}
const noop = () => () => {}
function useDraft(): Form | null {
  const raw = useSyncExternalStore(noop, readDraft, () => null)
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as Partial<Form>
    return FIELD_ORDER.every((f) => typeof d[f] === "string") ? (d as Form) : null
  } catch {
    return null
  }
}

function validate(form: Form, carrierId: string | null, providerId: string | null): Errors {
  const e: Errors = {}
  if (!form.first_name.trim()) e.first_name = "Укажите имя"
  if (!form.last_name.trim()) e.last_name = "Укажите фамилию — она нужна для получения посылки"
  if (!form.phone) e.phone = "Укажите телефон"
  else if (!isValidPhone(form.phone)) e.phone = "Номер должен быть из 10 цифр после +7"
  if (!form.email.trim()) e.email = "Укажите email для связи по заказу"
  else if (!EMAIL_RE.test(form.email.trim())) e.email = "Проверьте email: например, name@mail.ru"
  if (!form.city.trim()) e.city = "Укажите город"
  if (!form.address_1.trim()) e.address_1 = "Укажите улицу, дом и квартиру"
  if (!/^\d{6}$/.test(form.postal_code)) e.postal_code = form.postal_code ? "Индекс — 6 цифр" : "Укажите индекс"
  if (!carrierId) e.carrier = "Выберите способ доставки"
  if (!providerId) e.payment = "Выберите способ оплаты"
  return e
}

export function CheckoutView({
  cart,
  carriers,
  paymentProviders,
}: {
  cart: HttpTypes.StoreCart
  carriers: CarrierOption[]
  paymentProviders: string[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(() => initialForm(cart))
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)
  const [carrierId, setCarrierId] = useState<string | null>(
    cart.shipping_methods?.[0]?.shipping_option_id ?? (carriers.length === 1 ? carriers[0].id : null)
  )
  const [providerId, setProviderId] = useState<string | null>(paymentProviders.length === 1 ? paymentProviders[0] : null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const draft = useDraft()
  const formEmpty = FIELD_ORDER.every((f) => !form[f])

  const carrier = carriers.find((c) => c.id === carrierId) ?? null
  const currentShipping = cart.shipping_total ?? 0
  const shipping = carrier?.amount ?? null
  const total = (cart.total ?? 0) - currentShipping + (shipping ?? 0)
  const count = itemsCount(cart)

  const update = (name: FieldName, value: string) => {
    const next = { ...form, [name]: value }
    setForm(next)
    // после первой попытки отправки ошибки пересчитываются на лету — видно, что поле исправлено
    if (touched) setErrors(validate(next, carrierId, providerId))
  }

  const focusFirstError = (e: Errors) => {
    const first = FIELD_ORDER.find((f) => e[f]) ?? (e.carrier ? "carrier" : e.payment ? "payment" : null)
    if (!first) return
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    el?.focus({ preventScroll: true })
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (submitting) return
    setTouched(true)
    const e = validate(form, carrierId, providerId)
    setErrors(e)
    if (Object.keys(e).length) {
      focusFirstError(e)
      return
    }

    setSubmitting(true)
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, city: form.city, address_1: form.address_1, postal_code: form.postal_code })
      )
    } catch {
      /* приватный режим — не страшно */
    }

    const addressError = await saveCheckoutAddress({ ...form, phone: toE164(form.phone) })
    if (addressError) {
      setErrors({ form: addressError })
      setSubmitting(false)
      return
    }
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: carrierId! })
      await initiatePaymentSession(cart, { provider_id: providerId! })
      // при успехе placeOrder делает redirect на страницу заказа
      await placeOrder()
      setErrors({ form: "Не получилось оформить заказ. Проверьте данные и попробуйте ещё раз." })
    } catch (err) {
      if (isRedirect(err)) throw err
      setErrors({ form: orderErrorMessage(err) })
      router.refresh()
    }
    setSubmitting(false)
  }

  return (
    <div className="content-container !px-4 pb-[calc(6rem_+_env(safe-area-inset-bottom))] pt-4 lg:!px-6 lg:pb-16">
      <h1 className="text-2xl font-bold lg:text-3xl">Оформление заказа</h1>

      <form ref={formRef} onSubmit={submit} noValidate className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        <div className="space-y-4">
          <MobileSummary cart={cart} count={count} total={total} />

          <Section step={1} title="Получатель">
            {draft && formEmpty && (
              <button
                type="button"
                onClick={() => setForm(draft)}
                className="mb-4 flex w-full items-center gap-3 rounded-md bg-dl-muted p-3 text-left text-sm hover:bg-dl-border"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
                  <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">Заполнить как в прошлый раз</span>
                  <span className="block truncate text-xs text-dl-fg-muted">
                    {draft.first_name} {draft.last_name}, {draft.city}
                  </span>
                </span>
              </button>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="first_name" label="Имя" value={form.first_name} error={errors.first_name} onChange={update} autoComplete="given-name" enterKeyHint="next" />
              <Field name="last_name" label="Фамилия" value={form.last_name} error={errors.last_name} onChange={update} autoComplete="family-name" enterKeyHint="next" />
              <Field
                name="phone"
                label="Телефон"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 (999) 123-45-67"
                value={form.phone}
                error={errors.phone}
                onChange={(n, v) => update(n, maskPhoneInput(v, form.phone))}
                hint="Для связи по заказу и SMS от службы доставки"
                enterKeyHint="next"
              />
              <Field
                name="email"
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@mail.ru"
                value={form.email}
                error={errors.email}
                onChange={(n, v) => update(n, v.trim())}
                hint="Для связи по заказу, без рассылок"
                enterKeyHint="next"
              />
            </div>
          </Section>

          <Section step={2} title="Доставка">
            <fieldset data-field="carrier" tabIndex={-1} className="outline-none" aria-describedby={errors.carrier ? "carrier-error" : undefined}>
              <legend className="sr-only">Способ доставки</legend>
              {carriers.length === 0 ? (
                <p className="rounded-md bg-dl-danger-soft p-3 text-sm text-dl-danger">
                  Не получилось загрузить способы доставки. Обновите страницу.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {carriers.map((c) => (
                    <RadioCard
                      key={c.id}
                      name="carrier"
                      checked={carrierId === c.id}
                      onSelect={() => {
                        setCarrierId(c.id)
                        if (touched) setErrors(validate(form, c.id, providerId))
                      }}
                      title={c.name}
                      aside={c.amount === 0 ? <span className="font-semibold text-dl-success">Бесплатно</span> : formatPrice(c.amount)}
                      description={[c.description, c.days && `${c.days} после отправки`].filter(Boolean).join(" · ")}
                      invalid={!!errors.carrier}
                    />
                  ))}
                </div>
              )}
              {errors.carrier && <FieldError id="carrier-error">{errors.carrier}</FieldError>}
            </fieldset>

            <OriginNote items={cart.items ?? []} />

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <Field name="city" label="Город" value={form.city} error={errors.city} onChange={update} autoComplete="address-level2" enterKeyHint="next" />
              <Field
                name="postal_code"
                label="Индекс"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="123456"
                maxLength={6}
                value={form.postal_code}
                error={errors.postal_code}
                onChange={(n, v) => update(n, v.replace(/\D/g, "").slice(0, 6))}
                enterKeyHint="next"
              />
              <div className="sm:col-span-2">
                <Field
                  name="address_1"
                  label="Улица, дом, квартира"
                  autoComplete="street-address"
                  placeholder="ул. Тверская, д. 1, кв. 10"
                  value={form.address_1}
                  error={errors.address_1}
                  onChange={update}
                  enterKeyHint="done"
                />
              </div>
            </div>
          </Section>

          <Section step={3} title="Оплата">
            <fieldset data-field="payment" tabIndex={-1} className="outline-none">
              <legend className="sr-only">Способ оплаты</legend>
              {paymentProviders.length === 0 ? (
                <p className="rounded-md bg-dl-danger-soft p-3 text-sm text-dl-danger">Способы оплаты недоступны. Попробуйте позже.</p>
              ) : (
                <div className="grid gap-2">
                  {paymentProviders.map((id) => {
                    const label = PAYMENT_LABELS[id] ?? { title: id, hint: "" }
                    return (
                      <RadioCard
                        key={id}
                        name="payment"
                        checked={providerId === id}
                        onSelect={() => {
                          setProviderId(id)
                          if (touched) setErrors(validate(form, carrierId, id))
                        }}
                        title={label.title}
                        description={label.hint}
                        invalid={!!errors.payment}
                      />
                    )
                  })}
                </div>
              )}
              {errors.payment && <FieldError id="payment-error">{errors.payment}</FieldError>}
            </fieldset>
          </Section>
        </div>

        <aside className="mt-4 lg:sticky lg:top-20 lg:mt-0">
          <div className="hidden rounded-lg bg-dl-surface p-5 ring-1 ring-dl-border lg:block">
            <h2 className="text-lg font-bold">Ваш заказ</h2>
            <ItemList items={cart.items ?? []} />
          </div>
          <div className="rounded-lg bg-dl-surface p-4 ring-1 ring-dl-border lg:mt-4 lg:p-5">
            <Totals cart={cart} shipping={shipping} total={total} count={count} />
            {errors.form && (
              <p role="alert" className="mt-3 rounded-md bg-dl-danger-soft p-3 text-sm text-dl-danger">
                {errors.form}
              </p>
            )}
            <SubmitButton submitting={submitting} total={total} className="mt-4 hidden lg:flex" />
            <p className="mt-3 text-xs leading-relaxed text-dl-fg-muted">
              Возврат в течение 14 дней с момента получения.
            </p>
          </div>
        </aside>

        {/* Мобильная кнопка всегда под пальцем */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-dl-border bg-dl-surface/95 px-4 pb-[calc(0.625rem_+_env(safe-area-inset-bottom))] pt-2.5 shadow-dl-up backdrop-blur lg:hidden">
          <SubmitButton submitting={submitting} total={total} className="flex" />
        </div>
      </form>
    </div>
  )
}

function isRedirect(err: unknown) {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
}

function orderErrorMessage(err: unknown) {
  const msg = err instanceof Error ? err.message.toLowerCase() : ""
  if (msg.includes("inventory") || msg.includes("stock") || msg.includes("quantity")) {
    return "Пока вы оформляли заказ, часть товаров закончилась. Вернитесь в корзину — мы покажем, что изменилось."
  }
  return "Не получилось оформить заказ. Проверьте соединение и попробуйте ещё раз."
}

/* ---------- элементы формы ---------- */

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${step}`} className="rounded-lg bg-dl-surface p-4 ring-1 ring-dl-border lg:p-6">
      <h2 id={`step-${step}`} className="mb-4 flex items-center gap-2.5 text-lg font-bold">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-dl-fg text-sm text-dl-bg" aria-hidden>
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  name,
  label,
  value,
  error,
  hint,
  onChange,
  ...rest
}: {
  name: FieldName
  label: string
  value: string
  error?: string
  hint?: string
  onChange: (name: FieldName, value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">) {
  const id = `f-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        data-field={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clx(
          // 16px — iOS не зумит страницу при фокусе
          "h-12 w-full rounded-md border bg-dl-bg px-3.5 text-base outline-none transition-colors placeholder:text-dl-fg-muted/70 focus:border-dl-fg focus:ring-1 focus:ring-dl-fg",
          error ? "border-dl-danger" : "border-dl-border-strong"
        )}
        {...rest}
      />
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-dl-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 flex items-start gap-1 text-xs font-medium text-dl-danger">
      <svg viewBox="0 0 24 24" className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 7.5v5.5M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  )
}

function RadioCard({
  name,
  checked,
  onSelect,
  title,
  aside,
  description,
  invalid,
}: {
  name: string
  checked: boolean
  onSelect: () => void
  title: string
  aside?: React.ReactNode
  description?: string
  invalid?: boolean
}) {
  return (
    <label
      className={clx(
        "flex min-h-[3.5rem] cursor-pointer gap-3 rounded-md border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-dl-fg",
        checked ? "border-dl-fg bg-dl-bg ring-1 ring-dl-fg" : invalid ? "border-dl-danger" : "border-dl-border-strong hover:border-dl-fg"
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} aria-label={title} className="sr-only" />
      <span
        className={clx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", checked ? "border-dl-fg" : "border-dl-border-strong")}
        aria-hidden
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-dl-fg" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{title}</span>
          {aside && <span className="shrink-0 text-sm tabular-nums">{aside}</span>}
        </span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-dl-fg-muted">{description}</span>}
      </span>
    </label>
  )
}

function SubmitButton({ submitting, total, className }: { submitting: boolean; total: number; className?: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      aria-busy={submitting}
      className={clx(
        "h-12 w-full items-center justify-center gap-2 rounded-md bg-dl-fg px-4 font-semibold text-dl-bg transition-opacity active:opacity-80 disabled:opacity-60",
        className
      )}
    >
      {submitting ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-dl-bg/40 border-t-dl-bg" aria-hidden />
          Оформляем…
        </>
      ) : (
        <>
          Подтвердить заказ<span className="tabular-nums opacity-80">· {formatPrice(total)}</span>
        </>
      )}
    </button>
  )
}

/* ---------- сводка ---------- */

const days = (n: number) => pluralize(n, ["день", "дня", "дней"])

/** Где лежат товары: если часть едет из Китая, честно говорим о сроках */
function OriginNote({ items }: { items: CartItem[] }) {
  const groups = groupByOrigin(items)
  if (!groups.some((g) => g.origin === "china")) return null
  const mixed = groups.length > 1
  return (
    <p className="mt-3 rounded-md bg-dl-muted p-3 text-xs leading-relaxed">
      {mixed ? (
        <>
          Часть товаров едет из Китая: отправим их со склада за {DELIVERY.china.minDays}–{DELIVERY.china.maxDays} {days(DELIVERY.china.maxDays)}, товары из
          России — за {DELIVERY.russia.minDays}–{DELIVERY.russia.maxDays} {days(DELIVERY.russia.maxDays)}. Срок перевозчика добавляется после отправки.
        </>
      ) : (
        <>
          Товары едут из Китая: до отправки по России — {DELIVERY.china.minDays}–{DELIVERY.china.maxDays} {days(DELIVERY.china.maxDays)}, затем срок перевозчика.
        </>
      )}
    </p>
  )
}

function MobileSummary({ cart, count, total }: { cart: HttpTypes.StoreCart; count: number; total: number }) {
  const [open, setOpen] = useState(false)
  const items = cart.items ?? []
  return (
    <div className="rounded-lg bg-dl-surface ring-1 ring-dl-border lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-summary"
        className="flex min-h-[3.5rem] w-full items-center gap-3 px-4 py-2 text-left"
      >
        <span className="flex -space-x-3" aria-hidden>
          {items.slice(0, 3).map((i) => (
            <span key={i.id} className="relative h-10 w-8 overflow-hidden rounded-sm bg-dl-muted ring-2 ring-dl-surface">
              {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="32px" className="object-cover" />}
            </span>
          ))}
        </span>
        <span className="flex-1 text-sm">
          {count} {pluralize(count, ["товар", "товара", "товаров"])}
          <span className="block text-xs text-dl-fg-muted">{open ? "Скрыть состав" : "Показать состав"}</span>
        </span>
        <span className="font-bold tabular-nums">{formatPrice(total)}</span>
        <svg viewBox="0 0 24 24" className={clx("h-5 w-5 transition-transform", open && "rotate-180")} aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div id="mobile-summary" className="border-t border-dl-border px-4 pb-4">
          <ItemList items={items} />
        </div>
      )}
    </div>
  )
}

function ItemList({ items }: { items: CartItem[] }) {
  return (
    <ul className="mt-3 space-y-3">
      {items.map((i) => (
        <li key={i.id} className="flex gap-3">
          <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-dl-muted">
            {i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="48px" className="object-cover" />}
            {i.quantity > 1 && (
              <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-dl-fg px-1 text-[11px] font-bold text-dl-bg">
                {i.quantity}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="line-clamp-2 font-medium">{i.product_title}</span>
            <span className="block text-xs text-dl-fg-muted">
              {[i.variant_title !== "Default variant" ? i.variant_title : null, i.quantity > 1 ? `${i.quantity} шт.` : null].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice((i.unit_price ?? 0) * i.quantity)}</span>
        </li>
      ))}
    </ul>
  )
}

function Totals({ cart, shipping, total, count }: { cart: HttpTypes.StoreCart; shipping: number | null; total: number; count: number }) {
  const itemsTotal = cart.original_item_total ?? cart.item_subtotal ?? 0
  const discount = cart.discount_total ?? 0
  const codes = (cart.promotions ?? []).map((p) => p.code).filter(Boolean)
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-2">
        <dt className="text-dl-fg-muted">
          {count} {pluralize(count, ["товар", "товара", "товаров"])}
        </dt>
        <dd className="tabular-nums">{formatPrice(itemsTotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between gap-2">
          <dt className="text-dl-fg-muted">Скидка{codes.length ? ` (${codes.join(", ")})` : ""}</dt>
          <dd className="tabular-nums text-dl-success">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-2">
        <dt className="text-dl-fg-muted">Доставка</dt>
        <dd className="tabular-nums">
          {shipping === null ? <span className="text-dl-fg-muted">выберите способ</span> : shipping === 0 ? <span className="text-dl-success">бесплатно</span> : formatPrice(shipping)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-2 border-t border-dl-border pt-3">
        <dt className="font-bold">Итого</dt>
        <dd className="text-xl font-bold tabular-nums">{formatPrice(total)}</dd>
      </div>
      <p className="text-xs text-dl-fg-muted">Цены с НДС</p>
    </dl>
  )
}
