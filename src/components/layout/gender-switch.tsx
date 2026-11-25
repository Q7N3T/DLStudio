"use client";

import { SegmentedControl } from "@/components/shop/segmented-control";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Gender } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences";

const OPTIONS = [
  { value: "man", label: "Мужчинам" },
  { value: "woman", label: "Женщинам" },
] satisfies { value: Gender; label: string }[];

export function GenderSwitch({ className, size }: { className?: string; size?: "sm" | "md" }) {
  const hydrated = useHydrated();
  const gender = usePreferences((s) => s.gender);
  const setGender = usePreferences((s) => s.setGender);

  return (
    <SegmentedControl
      aria-label="Раздел каталога"
      options={OPTIONS}
      // До гидрации показываем значение по умолчанию, чтобы не было mismatch
      value={hydrated ? gender : "man"}
      onValueChange={setGender}
      size={size}
      className={cn(!hydrated && "opacity-90", className)}
    />
  );
}
