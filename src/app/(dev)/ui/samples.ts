import type { ProductSummary } from "@/lib/catalog/types";

const img = (n: number, alt = "") => ({ src: `/placeholders/product-${n}.svg`, alt });

const base: ProductSummary = {
  id: 1,
  slug: "sample-jacket",
  title: "Deconstructed Workwear Jacket",
  productType: "Куртка",
  studio: { id: 1, slug: "19-studio", name: "19 Studio" },
  price: { current: 14590, regular: 14590 },
  onSale: false,
  images: [img(1, "Куртка спереди"), img(2, "Куртка сзади")],
  colors: [{ slug: "black", name: "Чёрный", hex: "#1a1a1a" }],
  sizes: [
    { value: "S", inStock: true },
    { value: "M", inStock: true },
    { value: "L", inStock: false },
    { value: "XL", inStock: true },
  ],
  inStock: true,
  delivery: "china",
  isNew: false,
};

/** Карточки во всех состояниях для /ui */
export const sampleProducts: { label: string; product: ProductSummary }[] = [
  { label: "Обычная · из Китая", product: base },
  {
    label: "Новинка · из России",
    product: {
      ...base,
      id: 2,
      slug: "sample-hoodie",
      title: "Heavyweight Washed Hoodie",
      productType: "Худи",
      studio: { id: 2, slug: "dazo", name: "DAZO" },
      delivery: "russia",
      isNew: true,
      images: [img(3), img(4)],
      sizes: [{ value: "M", inStock: true }],
    },
  },
  {
    label: "Скидка",
    product: {
      ...base,
      id: 3,
      slug: "sample-pants",
      title: "Wide Leg Parachute Pants With Very Long Name That Wraps",
      productType: "Брюки",
      studio: { id: 3, slug: "2guns", name: "2GUNS" },
      price: { current: 7990, regular: 9990 },
      onSale: true,
      images: [img(5)],
    },
  },
  {
    label: "Диапазон цен",
    product: {
      ...base,
      id: 4,
      slug: "sample-boots",
      title: "Deconstructed High Top Training Boots",
      productType: "Ботинки",
      studio: { id: 4, slug: "hanqiaoriji", name: "HANQIAORIJI" },
      price: { current: 13490, regular: 13490, min: 13490, max: 14590 },
      images: [img(6), img(1)],
      sizes: ["39", "40", "41", "42", "43", "44"].map((value) => ({ value, inStock: true })),
    },
  },
  {
    label: "Продано",
    product: {
      ...base,
      id: 5,
      slug: "sample-soldout",
      title: "Cropped Denim Jacket",
      productType: "Джинсовая куртка",
      studio: { id: 5, slug: "11kn", name: "11KN" },
      inStock: false,
      sizes: base.sizes.map((s) => ({ ...s, inStock: false })),
      images: [img(2)],
    },
  },
  {
    label: "Без фото и студии",
    product: { ...base, id: 6, slug: "sample-noimg", studio: null, images: [] },
  },
];
