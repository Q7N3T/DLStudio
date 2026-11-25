"use client"

import { clx } from "@medusajs/ui"
import { Drawer } from "vaul"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  /** Закреплённый низ (кнопка «Показать N товаров» и т.п.) */
  footer?: React.ReactNode
  className?: string
}

/**
 * Bottom sheet (vaul): свайп вниз закрывает, фокус заперт внутри, Esc закрывает.
 * На десктопе открывается так же снизу, но не шире 640px — по центру.
 */
export function BottomSheet({ open, onOpenChange, title, description, children, footer, className }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/40" />
        <Drawer.Content
          className={clx(
            "fixed inset-x-0 bottom-0 z-[90] mx-auto flex max-h-[90dvh] w-full max-w-[640px] flex-col rounded-t-2xl bg-dl-surface outline-none",
            className
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-dl-border-strong" />
          <div className="flex items-start justify-between gap-4 px-4 pb-2 pt-3">
            <div>
              <Drawer.Title className="text-lg font-bold">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-0.5 text-sm text-dl-fg-muted">{description}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{title}</Drawer.Description>
              )}
            </div>
            <Drawer.Close
              aria-label="Закрыть"
              className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dl-fg-muted hover:bg-dl-muted"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer && (
            <div className="border-t border-dl-border bg-dl-surface px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
          {!footer && <div className="h-[env(safe-area-inset-bottom)] shrink-0" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
