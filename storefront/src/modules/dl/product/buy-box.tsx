"use client"

import { addToCart } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import {
  COLOR_OPTION,
  isInStock,
  isShoes,
  optionByTitle,
  productDetails,
  productOrigin,
  productPrice,
  SIZE_OPTION,
  sizesForColor,
  variantOptionValue,
  variantPrice,
} from "@lib/dl/product"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { BottomSheet } from "../ui/bottom-sheet"
import { ChipGroup } from "../ui/chips"
import { Price } from "../ui/price"
import { HowToMeasure, SizeChart } from "./size-chart"

interface BuyBoxProps {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const ONE_SIZE = "Единый"

export function BuyBox({ product, countryCode }: BuyBoxProps) {
  const router = useRouter()
  const details = useMemo(() => productDetails(product), [product])
  const shoes = isShoes(product)
  const fromRussia = productOrigin(product) === "russia"

  const colorOption = optionByTitle(product, COLOR_OPTION)
  const colors = useMemo(() => {
    const values = [...new Set((colorOption?.values ?? []).map((v) => v.value))]
    return values.map((value) => ({
      value,
      disabled: !(product.variants ?? []).some((v) => variantOptionValue(v, COLOR_OPTION, product) === value && isInStock(v)),
    }))
  }, [colorOption, product])

  // Единственный доступный размер выбираем сами — меньше лишних тапов
  const autoSize = (c: string | null, current: string | null) => {
    const available = sizesForColor(product, c).filter((s) => s.value !== ONE_SIZE && s.inStock)
    if (current && available.some((s) => s.value === current)) return current
    return available.length === 1 ? available[0].value : null
  }

  // По умолчанию — первый цвет в наличии
  const [color, setColorState] = useState<string | null>(() => colors.find((c) => !c.disabled)?.value ?? colors[0]?.value ?? null)
  const [size, setSizeState] = useState<string | null>(() => autoSize(color, null))
  const sizes = useMemo(() => sizesForColor(product, color), [product, color])
  const realSizes = sizes.filter((s) => s.value !== ONE_SIZE)
  const availableSizes = realSizes.filter((s) => s.inStock)

  const needsSize = realSizes.length > 0
  const variant = useMemo(() => {
    return (product.variants ?? []).find((v) => {
      const c = variantOptionValue(v, COLOR_OPTION, product)
      const s = variantOptionValue(v, SIZE_OPTION, product)
      return (!colorOption || c === color) && (!needsSize ? true : s === size)
    })
  }, [product, color, size, colorOption, needsSize])

  const price = variant ? variantPrice(variant) : productPrice(product)
  const soldOut = !(product.variants ?? []).some(isInStock)
  const canBuy = !!variant && isInStock(variant) && (!needsSize || !!size)

  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle")
  const [addedCount, setAddedCount] = useState(0)
  const [nudge, setNudge] = useState(false)
  const [chartOpen, setChartOpen] = useState(false)
  const sizesRef = useRef<HTMLDivElement>(null)

  // Смена цвета/размера: размер пересчитываем, кнопка снова «В корзину»
  const resetAdded = () => setState((s) => (s === "added" ? "idle" : s))
  const setColor = (c: string) => {
    setColorState(c)
    setSizeState((current) => autoSize(c, current))
    resetAdded()
  }
  const setSize = (s: string) => {
    setSizeState(s)
    setNudge(false)
    resetAdded()
  }

  const askForSize = () => {
    setNudge(true)
    sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    if (navigator.vibrate) navigator.vibrate([10, 40, 10])
    setTimeout(() => setNudge(false), 2500)
  }

  const add = async (then?: "checkout") => {
    if (!canBuy) return askForSize()
    setState("adding")
    try {
      await addToCart({ variantId: variant!.id, quantity: 1, countryCode })
      notifyCartUpdated()
      setAddedCount((n) => n + 1)
      setState("added")
      if (then === "checkout") router.push(`/${countryCode}/checkout?step=address`)
    } catch {
      setState("error")
    }
  }

  // Закреплённая панель — когда основная кнопка ушла из вида (только телефон)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(true)
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting || e.boundingClientRect.top > window.innerHeight), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const cartHref = `/${countryCode}/cart`
  const primary =
    state === "added" ? (
      <Link
        href={cartHref}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-md border-2 border-dl-fg bg-dl-surface text-base font-semibold transition-colors hover:bg-dl-muted"
      >
        Перейти в корзину
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-dl-fg px-1.5 text-xs text-white">{addedCount}</span>
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => add()}
        disabled={soldOut || state === "adding"}
        aria-describedby={nudge ? "size-hint" : undefined}
        className={clx(
          "flex h-[52px] w-full items-center justify-center rounded-md text-base font-semibold text-white transition-[background-color,opacity,transform] duration-150 active:translate-y-px",
          soldOut ? "cursor-not-allowed bg-dl-soldout" : "bg-dl-fg hover:bg-dl-fg/85",
          state === "adding" && "opacity-70"
        )}
      >
        {soldOut ? "Нет в наличии" : state === "adding" ? "Добавляем…" : "В корзину"}
      </button>
    )

  return (
    <div className="flex flex-col gap-5">
      <Price price={price} size="lg" />

      {colors.length > 1 && (
        <div>
          <p className="mb-2 text-sm">
            <span className="text-dl-fg-muted">Цвет:</span> <span className="font-semibold">{color}</span>
          </p>
          <ChipGroup label="Цвет" options={colors} value={color} onChange={setColor} />
        </div>
      )}

      {needsSize && (
        <div ref={sizesRef} className="scroll-mt-24">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="text-dl-fg-muted">Размер:</span>{" "}
              <span className="font-semibold">{size ?? (availableSizes.length ? "не выбран" : "нет в наличии")}</span>
            </p>
            <button
              type="button"
              onClick={() => setChartOpen(true)}
              className="-mr-1 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-semibold underline decoration-dl-border-strong underline-offset-4 hover:decoration-dl-fg"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" stroke="currentColor" strokeWidth="1.6" fill="none" />
              </svg>
              {shoes ? "Как выбрать размер" : "Таблица размеров"}
            </button>
          </div>
          <ChipGroup
            label="Размер"
            options={realSizes.map((s) => ({ value: s.value, disabled: !s.inStock }))}
            value={size}
            onChange={setSize}
            invalid={nudge}
          />
          <p id="size-hint" role="status" className={clx("mt-2 min-h-5 text-sm font-semibold text-dl-brand-strong", !nudge && "sr-only")}>
            {nudge ? "Выберите размер" : ""}
          </p>
          {availableSizes.length === 1 && (realSizes.length > 1 || fromRussia) && (
            <p className="-mt-1 text-sm font-semibold text-dl-brand-strong">
              {fromRussia ? "Последний в наличии — успейте забрать" : "Остался последний размер"}
            </p>
          )}
        </div>
      )}

      <div ref={ctaRef} className="flex flex-col gap-1">
        {primary}
        {state === "error" && (
          <p role="alert" className="text-sm text-dl-danger">
            Не получилось добавить в корзину. Попробуйте ещё раз или напишите нам в Telegram.
          </p>
        )}
        {!soldOut && state !== "added" && (
          <button
            type="button"
            onClick={() => add("checkout")}
            className="min-h-[44px] text-sm font-semibold underline decoration-dl-border-strong underline-offset-4 hover:decoration-dl-fg"
          >
            Купить в один клик
          </button>
        )}
      </div>

      {/* Закреплённая панель на телефоне (над таб-баром) */}
      <div
        aria-hidden={ctaVisible}
        className={clx(
          "fixed inset-x-0 z-40 border-t border-dl-border bg-dl-surface/95 px-4 py-2.5 shadow-dl-up backdrop-blur transition-transform duration-200 ease-dl lg:hidden",
          "bottom-[calc(var(--dl-tabbar-h)_+_env(safe-area-inset-bottom))]",
          ctaVisible ? "pointer-events-none translate-y-[calc(100%_+_var(--dl-tabbar-h))]" : "translate-y-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Price price={price} size="md" />
            <p className="truncate text-xs text-dl-fg-muted">
              {needsSize ? (size ? `Размер ${size}` : "Размер не выбран") : color ?? ""}
            </p>
          </div>
          <div className="w-[48%] shrink-0" tabIndex={ctaVisible ? -1 : undefined}>
            {state === "added" ? (
              <Link href={cartHref} tabIndex={ctaVisible ? -1 : 0} className="flex h-11 w-full items-center justify-center rounded-md border-2 border-dl-fg text-sm font-semibold">
                В корзину · {addedCount}
              </Link>
            ) : (
              <button
                type="button"
                tabIndex={ctaVisible ? -1 : 0}
                onClick={() => add()}
                disabled={soldOut || state === "adding"}
                className={clx("h-11 w-full rounded-md text-sm font-semibold text-white", soldOut ? "bg-dl-soldout" : "bg-dl-fg")}
              >
                {soldOut ? "Нет в наличии" : needsSize && !size ? "Выбрать размер" : "В корзину"}
              </button>
            )}
          </div>
        </div>
      </div>

      <BottomSheet
        open={chartOpen}
        onOpenChange={setChartOpen}
        title={shoes ? "Размер обуви" : "Таблица размеров"}
        description={details.size_chart ? "Замеры этой модели в сантиметрах" : undefined}
        footer={
          needsSize ? (
            <div className="flex flex-col gap-2">
              <ChipGroup
                label="Размер в таблице"
                options={realSizes.map((s) => ({ value: s.value, disabled: !s.inStock }))}
                value={size}
                onChange={setSize}
              />
              <button
                type="button"
                onClick={() => setChartOpen(false)}
                disabled={!size}
                className="mt-1 h-12 w-full rounded-md bg-dl-fg text-sm font-semibold text-white disabled:opacity-40"
              >
                {size ? `Выбрать размер ${size}` : "Выберите размер"}
              </button>
            </div>
          ) : undefined
        }
      >
        {details.size_chart ? (
          <SizeChart details={details} selected={size} />
        ) : (
          <p className="text-sm text-dl-fg-muted">
            Для этой модели таблица пока не заполнена. Напишите нам в Telegram — пришлём замеры за пару минут.
          </p>
        )}
        <HowToMeasure shoes={shoes} />
      </BottomSheet>
    </div>
  )
}
