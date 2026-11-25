"use client";

import { Ruler } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { CLOTHING_SIZES, HOW_TO_MEASURE, SHOE_SIZES, shoeSizeForFoot } from "@/config/size-guide";
import { BottomSheet } from "./bottom-sheet";

interface SizeGuideSheetProps {
  kind: "clothing" | "shoes";
}

/** Ссылка «Таблица размеров» → bottom sheet с таблицей и подсказкой «как измерить». */
export function SizeGuideSheet({ kind }: SizeGuideSheetProps) {
  return (
    <BottomSheet
      title="Таблица размеров"
      description="Ориентир. Точные замеры конкретной модели — в разделе «Замеры»."
      trigger={
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
        >
          <Ruler className="size-4" aria-hidden />
          Таблица размеров
        </button>
      }
    >
      {kind === "shoes" ? <ShoeGuide /> : <ClothingGuide />}
    </BottomSheet>
  );
}

const th = "py-2 pr-3 text-left text-xs font-semibold text-foreground-muted";
const td = "py-2.5 pr-3 tabular-nums";

function ClothingGuide() {
  return (
    <div className="space-y-6">
      <table className="w-full text-sm">
        <caption className="sr-only">Обхваты в сантиметрах</caption>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>
              Размер
            </th>
            <th scope="col" className={th}>
              Грудь, см
            </th>
            <th scope="col" className={th}>
              Талия, см
            </th>
            <th scope="col" className={th}>
              Бёдра, см
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {CLOTHING_SIZES.map((r) => (
            <tr key={r.size}>
              <th scope="row" className={`${td} text-left font-semibold`}>
                {r.size}
              </th>
              <td className={td}>{r.chest}</td>
              <td className={td}>{r.waist}</td>
              <td className={td}>{r.hips}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <HowToMeasure items={HOW_TO_MEASURE.clothing} />
    </div>
  );
}

function ShoeGuide() {
  const id = useId();
  const [foot, setFoot] = useState("");
  const parsed = Number.parseFloat(foot.replace(",", "."));
  const suggestion = foot ? shoeSizeForFoot(parsed) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-surface-muted p-4">
        <label htmlFor={id} className="text-sm font-semibold">
          Длина стопы → размер
        </label>
        <div className="mt-2 flex items-center gap-3">
          <Input
            id={id}
            inputMode="decimal"
            placeholder="Например, 25,5"
            value={foot}
            onChange={(e) => setFoot(e.target.value)}
            className="h-11 max-w-36 bg-surface"
            aria-describedby={`${id}-result`}
          />
          <span className="text-sm text-foreground-muted">см</span>
        </div>
        <p id={`${id}-result`} aria-live="polite" className="mt-2 min-h-5 text-sm">
          {foot &&
            (suggestion ? (
              <>
                Ваш размер: <strong>{suggestion}</strong>
              </>
            ) : (
              "Такого размера нет в таблице — напишите нам, подберём."
            ))}
        </p>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Соответствие длины стопы и размера EU</caption>
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={th}>
              Размер EU
            </th>
            <th scope="col" className={th}>
              Длина стопы, см
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {SHOE_SIZES.map((r) => (
            <tr key={r.size} className={suggestion === r.size ? "bg-brand-soft" : undefined}>
              <th scope="row" className={`${td} text-left font-semibold`}>
                {r.size}
              </th>
              <td className={td}>{r.footCm.toString().replace(".", ",")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <HowToMeasure items={HOW_TO_MEASURE.shoes} />
    </div>
  );
}

function HowToMeasure({ items }: { items: readonly { label: string; text: string }[] }) {
  return (
    <section>
      <h3 className="text-sm font-bold">Как измерить</h3>
      <dl className="mt-2 space-y-2 text-sm">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="font-semibold">{i.label}</dt>
            <dd className="text-foreground-muted">{i.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
