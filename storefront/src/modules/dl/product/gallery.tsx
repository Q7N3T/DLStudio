"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { FavoriteButton } from "../ui/favorite-button"

interface GalleryProps {
  images: { url: string }[]
  alt: string
  productId: string
  /** Бейджи поверх первого кадра (скидка, «Продано») */
  overlay?: React.ReactNode
}

/**
 * Галерея карточки товара.
 * Телефон: лента на всю ширину со свайпом (scroll-snap), счётчик и точки; тап — полноэкранный просмотр.
 * Десктоп: большое фото + полоса превью слева.
 * Полноэкранный режим: свайп между кадрами, зум пальцами (нативный pinch-zoom) и двойным тапом.
 */
export function Gallery({ images, alt, productId, overlay }: GalleryProps) {
  const [index, setIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [openCount, setOpenCount] = useState(0)
  const openFullscreen = () => {
    setOpenCount((n) => n + 1)
    setFullscreen(true)
  }
  const trackRef = useRef<HTMLDivElement>(null)
  const count = images.length

  // Индекс по позиции прокрутки ленты
  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) setIndex(Math.max(0, Math.min(count - 1, i)))
  }, [index, count])

  const goTo = (i: number, behavior: ScrollBehavior = "smooth") => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior })
    setIndex(i)
  }

  if (!count) {
    return <div className="aspect-[3/4] w-full bg-dl-muted" aria-label="Фото скоро появится" />
  }

  return (
    <div className="lg:flex lg:gap-4">
      {/* Превью-полоса (десктоп) */}
      <div className="hidden w-[72px] shrink-0 flex-col gap-2 lg:flex" role="tablist" aria-label="Фото товара">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Фото ${i + 1} из ${count}`}
            onClick={() => goTo(i)}
            className={clx(
              "relative aspect-[3/4] overflow-hidden rounded-md border-2 transition-colors",
              i === index ? "border-dl-fg" : "border-transparent hover:border-dl-border-strong"
            )}
          >
            <Image src={img.url} alt="" fill sizes="72px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-dl-muted lg:rounded-md"
          aria-roledescription="карусель"
          aria-label={`Фото: ${alt}`}
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={openFullscreen}
              className="relative aspect-[3/4] w-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`Открыть фото ${i + 1} из ${count} на весь экран`}
            >
              <Image
                src={img.url}
                alt={i === 0 ? alt : `${alt}, фото ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {overlay && <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">{overlay}</div>}
        <FavoriteButton productId={productId} label={alt} className="absolute right-2 top-2 bg-white/80 backdrop-blur" />

        {count > 1 && (
          <>
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold tabular-nums text-white lg:hidden">
              {index + 1} / {count}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
              {images.slice(0, 10).map((img, i) => (
                <span
                  key={img.url}
                  className={clx("h-1.5 rounded-full bg-white transition-all duration-200", i === index ? "w-4 opacity-100" : "w-1.5 opacity-60")}
                />
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 hidden items-center lg:flex">
              <NavButton dir="prev" onClick={() => goTo((index - 1 + count) % count)} />
            </div>
            <div className="absolute inset-y-0 right-0 hidden items-center lg:flex">
              <NavButton dir="next" onClick={() => goTo((index + 1) % count)} />
            </div>
          </>
        )}
      </div>

      <Fullscreen
        key={openCount}
        open={fullscreen}
        onOpenChange={(open) => {
          setFullscreen(open)
        }}
        images={images}
        alt={alt}
        start={index}
        onIndexChange={(i) => goTo(i, "auto")}
      />
    </div>
  )
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Предыдущее фото" : "Следующее фото"}
      className="mx-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-dl-md backdrop-blur transition hover:bg-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function Fullscreen({
  open,
  onOpenChange,
  images,
  alt,
  start,
  onIndexChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: { url: string }[]
  alt: string
  start: number
  onIndexChange: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Состояние свежее при каждом открытии: родитель меняет key
  const [index, setIndex] = useState(start)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const el = ref.current
      if (el) el.scrollTo({ left: start * el.clientWidth, behavior: "auto" })
    })
  }, [open, start])

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    const next = (i + images.length) % images.length
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-0 z-[100] flex flex-col bg-white outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1)
            if (e.key === "ArrowLeft") go(index - 1)
          }}
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Description className="sr-only">Фото товара на весь экран. Листайте свайпом или стрелками.</Dialog.Description>
          <div className="flex items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
            <span className="px-3 text-sm font-semibold tabular-nums text-dl-fg-muted">
              {index + 1} / {images.length}
            </span>
            <Dialog.Close aria-label="Закрыть" className="inline-flex h-12 w-12 items-center justify-center rounded-full hover:bg-dl-muted">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Dialog.Close>
          </div>
          <div
            ref={ref}
            onScroll={() => {
              const el = ref.current
              if (!el) return
              const i = Math.round(el.scrollLeft / el.clientWidth)
              if (i !== index) {
                setIndex(i)
                setZoomed(false)
                onIndexChange(i)
              }
            }}
            className={clx("no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory", zoomed ? "overflow-hidden" : "overflow-x-auto")}
          >
            {images.map((img, i) => (
              <div
                key={img.url}
                className={clx("relative h-full w-full shrink-0 snap-center", zoomed && i === index ? "overflow-auto" : "overflow-hidden")}
                style={{ touchAction: zoomed ? "pan-x pan-y pinch-zoom" : "pan-x pinch-zoom" }}
                onDoubleClick={() => setZoomed((z) => !z)}
              >
                <div className={clx("relative h-full", zoomed && i === index ? "w-[200%] min-h-[200%]" : "w-full")}>
                  <Image src={img.url} alt={`${alt}, фото ${i + 1}`} fill sizes={zoomed ? "200vw" : "100vw"} className="object-contain" />
                </div>
              </div>
            ))}
          </div>
          <p className="py-2 text-center text-xs text-dl-fg-muted">Двойной тап — увеличить</p>
          <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => go(i)}
                aria-label={`Фото ${i + 1}`}
                className={clx("relative h-16 w-12 shrink-0 overflow-hidden rounded border-2", i === index ? "border-dl-fg" : "border-transparent")}
              >
                <Image src={img.url} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
