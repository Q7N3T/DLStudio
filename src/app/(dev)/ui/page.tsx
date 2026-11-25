import type { Metadata } from "next";
import { ArrowRight, Send } from "lucide-react";
import { PriceTag } from "@/components/shop/price-tag";
import { DeliveryBadge, ProductBadge } from "@/components/shop/product-badge";
import { ProductCard, ProductCardSkeleton, ProductGrid } from "@/components/shop/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatDeliveryWindow } from "@/lib/format";
import {
  ColorDemo,
  FilterChipsDemo,
  QuantityDemo,
  SegmentedDemo,
  SizeChipsDemo,
  StatesDemo,
} from "./demos";
import { sampleProducts } from "./samples";

export const metadata: Metadata = {
  title: "Витрина компонентов",
  robots: { index: false, follow: false },
};

const COLORS = [
  ["background", "#FAFAF8"],
  ["surface", "#FFFFFF"],
  ["surface-muted", "#F1F1EE"],
  ["foreground", "#1A1A1A"],
  ["foreground-muted", "#6B6B6B"],
  ["border", "#E6E6E3"],
  ["border-strong", "#CFCFCB"],
  ["brand", "#F26B3A · только декор"],
  ["brand-strong", "#CE410E · текст, AA 4.6:1"],
  ["brand-soft", "#FDEEE8"],
  ["success", "#2F6B4F"],
  ["danger", "#B42318"],
] as const;

const TYPE = [
  ["text-display font-display uppercase", "Final Winter Edit"],
  ["text-3xl font-bold", "Заголовок страницы"],
  ["text-2xl font-bold", "Секция главной"],
  ["text-xl font-semibold", "Подзаголовок"],
  ["text-base", "Основной текст. Индивидуальность интереснее, чем тренды."],
  ["text-sm", "Мелкий текст карточки товара"],
  ["text-xs text-foreground-muted", "Подписи и вспомогательный текст"],
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-32 border-t border-border py-10"
    >
      <h2
        id={`${id}-h`}
        className="mb-6 text-xs font-bold tracking-widest text-foreground-muted uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UiShowcasePage() {
  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Витрина компонентов</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
        Дизайн-токены и компоненты DL Studio во всех состояниях. Страница служебная и закрыта от
        индексации.
      </p>
      <nav aria-label="Разделы витрины" className="-mx-4 mt-6 no-scrollbar overflow-x-auto px-4">
        <ul className="flex gap-2 text-sm whitespace-nowrap">
          {[
            ["tokens", "Токены"],
            ["buttons", "Кнопки"],
            ["badges", "Бейджи и цены"],
            ["variants", "Размеры и цвета"],
            ["cards", "Карточки"],
            ["filters", "Фильтры"],
            ["states", "Состояния"],
            ["misc", "Прочее"],
          ].map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-flex h-11 items-center rounded-full border border-border-strong px-4 hover:border-foreground"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="tokens" title="Токены">
        <h3 className="mb-3 text-sm font-semibold">Цвета</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map(([name, value]) => (
            <li key={name} className="text-xs">
              <span
                className="block h-14 rounded-md border border-border"
                style={{ background: `var(--${name})` }}
              />
              <span className="mt-1.5 block font-semibold">{name}</span>
              <span className="text-foreground-muted">{value}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 mb-3 text-sm font-semibold">Типографика · Manrope / Unbounded</h3>
        <div className="space-y-3">
          {TYPE.map(([cls, sample]) => (
            <div key={cls} className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
              <code className="w-64 shrink-0 text-2xs text-foreground-muted">{cls}</code>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-10 mb-3 text-sm font-semibold">Радиусы, тени, отступы (шаг 4px)</h3>
        <div className="flex flex-wrap items-end gap-6">
          {(["rounded-sm", "rounded-md", "rounded-lg", "rounded-full"] as const).map((r) => (
            <div key={r} className="text-center text-2xs text-foreground-muted">
              <div className={`size-16 border border-border-strong bg-surface ${r}`} />
              <p className="mt-1">{r}</p>
            </div>
          ))}
          {(["shadow-sm", "shadow-md", "shadow-lg"] as const).map((s) => (
            <div key={s} className="text-center text-2xs text-foreground-muted">
              <div className={`size-16 rounded-md bg-surface ${s}`} />
              <p className="mt-1">{s}</p>
            </div>
          ))}
          <div className="flex items-end gap-2 text-2xs text-foreground-muted">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
              <div key={n} className="text-center">
                <div className="bg-brand" style={{ width: n * 4, height: n * 4 }} />
                <p className="mt-1">{n * 4}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="buttons" title="Кнопки">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">В корзину</Button>
          <Button size="lg" variant="brand">
            Забрать по AUTUMN
          </Button>
          <Button variant="outline">Таблица размеров</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Купить в один клик</Button>
          <Button disabled>Нет в наличии</Button>
          <Button size="icon" variant="outline" aria-label="Далее">
            <ArrowRight aria-hidden />
          </Button>
        </div>
        <div className="mt-4 max-w-sm space-y-3">
          <Button size="lg" block>
            В корзину
          </Button>
          <Button size="lg" block variant="outline">
            Перейти в корзину · 2
          </Button>
          <Button variant="outline" block asChild>
            <a href="https://t.me/dlstudiosupport" target="_blank" rel="noopener noreferrer">
              <Send aria-hidden /> Ответим в Telegram за ~5 минут
            </a>
          </Button>
        </div>
      </Section>

      <Section id="badges" title="Бейджи и цены">
        <div className="flex flex-wrap gap-2">
          <ProductBadge tone="new">New</ProductBadge>
          <ProductBadge tone="sale">−20%</ProductBadge>
          <ProductBadge tone="soldout">Продано</ProductBadge>
          <DeliveryBadge type="russia" />
          <DeliveryBadge type="china" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PriceTag price={{ current: 14590, regular: 14590 }} size="lg" />
          <PriceTag price={{ current: 7990, regular: 9990 }} size="lg" />
          <PriceTag price={{ current: 9990, regular: 9990, min: 9990, max: 12490 }} size="lg" />
          <PriceTag price={{ current: 1250000, regular: 1250000 }} size="lg" />
        </div>
        <p className="mt-6 text-sm">
          Блок даты на карточке товара: «Привезём{" "}
          <strong>{formatDeliveryWindow("china", new Date(2026, 11, 1))}</strong>» (из Китая, от 1
          декабря), «Привезём{" "}
          <strong>{formatDeliveryWindow("russia", new Date(2026, 11, 1))}</strong>» (из России).
        </p>
      </Section>

      <Section id="variants" title="Размеры и цвета">
        <SizeChipsDemo />
        <div className="mt-6">
          <ColorDemo />
        </div>
        <div className="mt-6">
          <SegmentedDemo />
        </div>
      </Section>

      <Section id="cards" title="Карточки товара · сетка 2/3/4">
        <ProductGrid>
          {sampleProducts.map(({ label, product }) => (
            <div key={product.id}>
              <p className="mb-2 text-2xs font-semibold text-foreground-muted uppercase">{label}</p>
              <ProductCard product={product} />
            </div>
          ))}
          <div>
            <p className="mb-2 text-2xs font-semibold text-foreground-muted uppercase">Skeleton</p>
            <ProductCardSkeleton />
          </div>
        </ProductGrid>
      </Section>

      <Section id="filters" title="Фильтры">
        <FilterChipsDemo />
      </Section>

      <Section id="states" title="Пустые состояния и ошибки">
        <StatesDemo />
      </Section>

      <Section id="misc" title="Аккордеоны и количество">
        <Accordion type="multiple" className="max-w-xl">
          <AccordionItem value="desc">
            <AccordionTrigger>Описание</AccordionTrigger>
            <AccordionContent>
              Многоструктурный верх, деконструктивные швы, усиленный мысок.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="care">
            <AccordionTrigger>Состав и уход</AccordionTrigger>
            <AccordionContent>Верх: спилок, текстиль. Подошва: резина.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="measures">
            <AccordionTrigger>Замеры</AccordionTrigger>
            <AccordionContent>Длина стельки 42 размера — 26,5 см.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-6">
          <QuantityDemo />
        </div>
      </Section>
    </div>
  );
}
