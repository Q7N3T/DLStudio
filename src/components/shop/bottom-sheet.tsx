"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Bottom sheet (vaul): свайп вниз закрывает, фокус заперт внутри, Esc закрывает.
 * Используется для таблицы размеров и фильтров на мобильных.
 */
export function BottomSheet({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  className,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className={cn("max-h-[88dvh] bg-surface", className)}>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : (
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
