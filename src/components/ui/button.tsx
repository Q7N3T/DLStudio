import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-150 ease-standard outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        /** Главное действие: графитовая заливка */
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        /** Акцентное действие (промо): оранжевый, проходящий AA */
        brand: "bg-brand-strong text-white hover:bg-brand-strong/90",
        outline: "border-border-strong bg-surface text-foreground hover:border-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-danger-soft text-danger hover:bg-danger/15",
        /** Вторичная текстовая кнопка («Купить в один клик») */
        link: "h-auto min-h-11 px-0 text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground",
      },
      size: {
        /** Все размеры дают зону нажатия ≥ 44px */
        default: "h-11 px-5",
        sm: "h-11 px-3 text-xs",
        lg: "h-13 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-11 [&_svg:not([class*='size-'])]:size-4",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  block,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
