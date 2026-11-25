"use client";

import { RotateCcw, SearchX, WifiOff } from "lucide-react";
import { useState } from "react";
import { ColorSwatches } from "@/components/shop/color-swatches";
import { FilterChips, type ActiveFilter } from "@/components/shop/filter-chips";
import { QuantityStepper } from "@/components/shop/quantity-stepper";
import { SegmentedControl } from "@/components/shop/segmented-control";
import { SizeChips } from "@/components/shop/size-chips";
import { SizeGuideSheet } from "@/components/shop/size-guide-sheet";
import { EmptyState, ErrorState } from "@/components/shop/states";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/** Интерактивные демо для витрины компонентов. */

export function SizeChipsDemo() {
  const [size, setSize] = useState<string | null>("M");
  return (
    <div className="space-y-3">
      <SizeChips
        value={size}
        onValueChange={setSize}
        sizes={[
          { value: "XS", inStock: false },
          { value: "S", inStock: true },
          { value: "M", inStock: true },
          { value: "L", inStock: false },
          { value: "XL", inStock: true },
          { value: "XXL", inStock: true },
        ]}
      />
      <div className="flex flex-wrap gap-x-6">
        <SizeGuideSheet kind="clothing" />
        <SizeGuideSheet kind="shoes" />
      </div>
    </div>
  );
}

export function ColorDemo() {
  const [color, setColor] = useState<string | null>("black");
  return (
    <ColorSwatches
      value={color}
      onValueChange={setColor}
      unavailable={["olive"]}
      colors={[
        { slug: "black", name: "Чёрный", hex: "#1a1a1a" },
        { slug: "white", name: "Белый", hex: "#f5f5f2" },
        { slug: "brown", name: "Коричневый", hex: "#6b4a35" },
        { slug: "olive", name: "Оливковый", hex: "#5d6340" },
        { slug: "mystery", name: "Хамелеон" },
      ]}
    />
  );
}

export function SegmentedDemo() {
  const [v, setV] = useState<"man" | "woman">("woman");
  const [sort, setSort] = useState("popular");
  return (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl
        aria-label="Раздел"
        value={v}
        onValueChange={setV}
        options={[
          { value: "man", label: "Мужчинам" },
          { value: "woman", label: "Женщинам" },
        ]}
      />
      <SegmentedControl
        aria-label="Сортировка"
        size="sm"
        value={sort}
        onValueChange={setSort}
        options={[
          { value: "popular", label: "Популярные" },
          { value: "new", label: "Новинки" },
          { value: "price-asc", label: "Цена ↑" },
          { value: "price-desc", label: "Цена ↓" },
        ]}
      />
    </div>
  );
}

const INITIAL_FILTERS: ActiveFilter[] = [
  { key: "size:M", label: "Размер M" },
  { key: "studio:dazo", label: "DAZO" },
  { key: "delivery:russia", label: "Из России" },
  { key: "price", label: "5 000 – 15 000 ₽" },
];

export function FilterChipsDemo() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [inStockOnly, setInStockOnly] = useState(true);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="instock" checked={inStockOnly} onCheckedChange={setInStockOnly} />
        <Label htmlFor="instock" className="min-h-11 text-sm">
          Только в наличии
        </Label>
      </div>
      <FilterChips
        filters={filters}
        onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
        onReset={() => setFilters([])}
      />
      {filters.length === 0 && (
        <Button variant="outline" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
          <RotateCcw aria-hidden /> Вернуть фильтры
        </Button>
      )}
    </div>
  );
}

export function QuantityDemo() {
  const [q, setQ] = useState(1);
  return <QuantityStepper value={q} onChange={setQ} label="Худи DAZO" />;
}

export function StatesDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-md border border-border bg-surface">
        <EmptyState
          icon={SearchX}
          title="Ничего не нашли по «курткаа»"
          description="Проверьте написание или посмотрите похожее: куртки, бомберы, пуховики."
          action={
            <>
              <Button size="sm">Все куртки</Button>
              <Button size="sm" variant="outline">
                Сбросить фильтры
              </Button>
            </>
          }
        />
      </div>
      <div className="space-y-4">
        <ErrorState
          icon={WifiOff}
          title="Не получилось загрузить товары"
          description="Похоже, пропал интернет. Проверьте соединение — мы подождём."
          action={
            <Button size="sm" variant="outline">
              Попробовать ещё раз
            </Button>
          }
        />
        <ErrorState
          title="Этот размер только что купили"
          description="Выберите другой или напишите нам в Telegram — поищем на складе."
        />
      </div>
    </div>
  );
}
