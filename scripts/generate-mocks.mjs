#!/usr/bin/env node
/**
 * Генератор фикстур Store API для MockProvider: node scripts/generate-mocks.mjs
 * Детерминированный (без Math.random): повторный запуск даёт тот же JSON.
 *
 * Схема и реальные значения сверены с dlstudio.store/wp-json/wc/store/v1 (25.11.2026):
 * ID и слаги категорий, слаги цветов, имена студий и тегов подборок — настоящие.
 * Товары, цены и описания — выдуманные. Изображения — нейтральные заглушки.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "mocks", "store-api");
const BASE = "https://dlstudio.store";

/* ---------- Справочники (реальные ID/слаги) ---------- */

const CATEGORIES = [
  [57, 0, "man", "Мужское"],
  [58, 0, "woman", "Женское"],
  [210, 0, "accessories", "Аксессуары"],
  [107, 0, "bags-and-backpacks", "Сумки и рюкзаки"],
  [139, 0, "warehouse-in-russia", "Товары из России"],
  [548, 0, "final-winter-edit", "Final Winter Edit"],
  [236, 57, "top-man", "Верх"],
  [237, 57, "bottom-man", "Низ"],
  [268, 57, "shoes-man", "Обувь"],
  [72, 236, "outerwear", "Верхняя одежда"],
  [133, 72, "jackets", "Пуховики и куртки"],
  [212, 133, "jackets-man", "Куртки"],
  [213, 133, "down-jacket-man", "Пуховики"],
  [214, 133, "bombers-man", "Бомберы"],
  [67, 236, "hoodie", "Худи"],
  [60, 236, "t-shirt", "Футболки"],
  [61, 236, "shirt", "Рубашки"],
  [117, 68, "sweaters", "Свитеры"],
  [68, 236, "sweatshirts-turtlenecks-longsleeves", "Свитшоты и свитеры"],
  [63, 237, "pants", "Брюки и штаны"],
  [64, 237, "jeans", "Джинсы"],
  [65, 237, "shorts", "Шорты"],
  [269, 268, "boots-man", "Ботинки"],
  [271, 268, "sneakers-man", "Кроссовки и кеды"],
  [234, 58, "top-woman", "Верх"],
  [235, 58, "bottom-woman", "Низ"],
  [243, 234, "outerwear-woman", "Верхняя одежда"],
  [244, 243, "jackets-woman", "Пуховики и куртки"],
  [245, 244, "jacket-womans", "Куртки"],
  [163, 234, "hoodie-woman", "Худи"],
  [317, 234, "t-shirt-woman", "Футболки"],
  [160, 58, "dresses", "Платья"],
  [161, 235, "skirt", "Юбки"],
  [164, 235, "pants-woman", "Брюки и штаны"],
  [109, 210, "hats", "Головные уборы"],
  [110, 109, "caps", "Кепки"],
  [130, 109, "hat", "Шапки"],
  [66, 210, "jewelry", "Украшения"],
  [81, 66, "rings", "Кольца"],
  [105, 66, "chains-and-pendants", "Цепочки и подвески"],
  [82, 210, "belts", "Ремни"],
];

// Теги студий: ID условные, слаги и имена — как на сайте
const STUDIOS = {
  19: [9001, "19-studio", "19 Studio"],
  dazo: [9002, "dazo-studio", "DAZO Studio"],
  hq: [9003, "hanqiaoriji", "HANQIAORIJI"],
  "11kn": [9004, "11kn", "11KN"],
  madwitch: [9005, "madwitch", "MADWITCH"],
  blacklist: [9006, "blacklist", "BLACKLIST"],
  xj: [9007, "xj-studio", "XJ Studio"],
  dl: [9008, "dl-studio", "DL Studio"],
  unfollow: [9009, "unfollow", "(un)follow"],
  mion: [9010, "mion", "MION"],
};
// Термины pa_brand: слаги местами отличаются от тегов (unf-brand ≠ unfollow) — как на сайте
const BRAND_TERMS = [
  [228, "19-studio", "19 Studio"],
  [229, "dazo-studio", "DAZO Studio"],
  [471, "hanqiaoriji", "HANQIAORIJI"],
  [553, "11kn", "11KN"],
  [347, "madwitch", "MADWITCH"],
  [351, "blacklist", "BLACKLIST"],
  [558, "xj-studio", "XJ Studio"],
  [253, "dl-studio", "DL Studio"],
  [506, "unf-brand", "(un)follow"],
  [565, "mion", "MION"],
];

const COLLECTION_TAGS = {
  street: [9101, "streetwear-essentials", "Streetwear Essentials"],
  minimal: [9102, "minimalist-chic", "Minimalist Chic"],
  tech: [9103, "techwear-vibes", "Techwear Vibes"],
  retro: [9104, "retro-vibes", "Retro Vibes"],
  r0104: [9201, "release-010426", "release-010426"],
  r1802: [9202, "release-1802", "release-1802"],
};

const COLORS = {
  black: "Чёрный",
  white: "Белый",
  brown: "Коричневый",
  beige: "Бежевый",
  gray: "Серый",
  khaki: "Хаки",
  "dark-blue": "Тёмно-синий",
  "dark-green": "Тёмно-зелёный",
  cream: "Кремовый",
  wine: "Винный",
  camouflage: "Камуфляж",
  sky: "Голубой",
};

const LETTERS = ["S", "M", "L", "XL"];
const LETTERS_W = ["XS", "S", "M", "L"];
const SHOES = ["39", "40", "41", "42", "43", "44"];
const SHOES_UNISEX = ["36", "37", "38", "39", "40", "41", "42"];
const RINGS = ["16", "17", "18", "19"];

/*
 * Товары. Поля:
 *  id, type(рус.), studio, title, cats[], colors[], sizes[], price, sale?, priceMax?,
 *  ru? (склад в России: доступны только sizesLeft), soldOut?, tags[], entities? (имя с &#171;)
 * Чем больше id — тем новее (как у WordPress).
 */
const P = [
  {
    id: 331501,
    t: "Куртка",
    s: "19",
    title: "Deconstructed Workwear Jacket",
    cats: [212],
    colors: ["black", "khaki"],
    sizes: LETTERS,
    price: 14590,
    tags: ["street", "r0104"],
  },
  {
    id: 331502,
    t: "Худи",
    s: "dazo",
    title: "Heavyweight Washed Hoodie",
    cats: [67],
    colors: ["gray", "black"],
    sizes: LETTERS,
    price: 8990,
    tags: ["street"],
  },
  {
    id: 331503,
    t: "Ботинки",
    s: "hq",
    title: "Deconstructed High Top Training Boots",
    cats: [269],
    colors: ["black"],
    sizes: SHOES,
    price: 14590,
    tags: ["tech"],
    entities: true,
  },
  {
    id: 331504,
    t: "Ботинки",
    s: "hq",
    title: "Deconstructed High Top Boxing Work Boots",
    cats: [269],
    colors: ["brown"],
    sizes: SHOES,
    price: 13890,
    tags: ["tech"],
    entities: true,
  },
  {
    id: 331505,
    t: "Брюки",
    s: "xj",
    title: "Wide Leg Parachute Pants",
    cats: [63],
    colors: ["khaki", "black"],
    sizes: LETTERS,
    price: 9990,
    sale: 7990,
    tags: ["tech", "street"],
  },
  {
    id: 331506,
    t: "Пуховик",
    s: "19",
    title: "Embroidery Plaid Down Jacket",
    cats: [213],
    colors: ["sky"],
    sizes: LETTERS,
    price: 18990,
    sale: 7990,
    ru: ["M"],
    tags: [],
    entities: true,
  },
  {
    id: 331507,
    t: "Джинсы",
    s: "11kn",
    title: "Washed Straight Leg Jeans",
    cats: [64],
    colors: ["dark-blue"],
    sizes: ["28", "30", "32", "34"],
    price: 7490,
    tags: ["retro"],
  },
  {
    id: 331508,
    t: "Футболка",
    s: "madwitch",
    title: "Distressed Graphic Tee",
    cats: [60],
    colors: ["white", "black"],
    sizes: LETTERS,
    price: 3990,
    tags: ["street", "r1802"],
  },
  {
    id: 331509,
    t: "Рубашка",
    s: "unfollow",
    title: "Oversized Linen Shirt",
    cats: [61],
    colors: ["cream", "beige"],
    sizes: LETTERS,
    price: 6490,
    tags: ["minimal"],
  },
  {
    id: 331510,
    t: "Свитер",
    s: "xj",
    title: "Chunky Knit Turtleneck",
    cats: [117],
    colors: ["cream", "dark-green"],
    sizes: LETTERS,
    price: 8490,
    priceMax: 8990,
    tags: ["minimal", "retro"],
  },
  {
    id: 331511,
    t: "Бомбер",
    s: "blacklist",
    title: "Padded Flight Bomber",
    cats: [214],
    colors: ["khaki"],
    sizes: LETTERS,
    price: 12990,
    ru: ["L", "XL"],
    tags: ["retro"],
  },
  {
    id: 331512,
    t: "Кроссовки",
    s: "mion",
    title: "Chunky Retro Runner Sneakers",
    cats: [271],
    colors: ["white", "gray"],
    sizes: SHOES,
    price: 10990,
    tags: ["retro", "street"],
  },
  {
    id: 331513,
    t: "Шорты",
    s: "dazo",
    title: "Cargo Nylon Shorts",
    cats: [65],
    colors: ["black"],
    sizes: LETTERS,
    price: 4990,
    soldOut: true,
    tags: ["tech"],
  },
  {
    id: 331514,
    t: "Куртка",
    s: "xj",
    title: "Waterproof Shell Jacket",
    cats: [212],
    colors: ["black", "camouflage"],
    sizes: LETTERS,
    price: 15990,
    tags: ["tech"],
  },
  {
    id: 331515,
    t: "Худи",
    s: "19",
    title: "Raw Edge Zip Hoodie",
    cats: [67],
    colors: ["wine"],
    sizes: LETTERS,
    price: 9490,
    ru: ["S"],
    tags: ["street"],
  },
  {
    id: 331516,
    t: "Брюки",
    s: "unfollow",
    title: "Pleated Wool Trousers",
    cats: [63],
    colors: ["gray"],
    sizes: LETTERS,
    price: 8990,
    tags: ["minimal"],
  },
  {
    id: 331517,
    t: "Футболка",
    s: "dl",
    title: "Boxy Logo Tee",
    cats: [60],
    colors: ["black", "white"],
    sizes: LETTERS,
    price: 2990,
    tags: ["minimal"],
  },
  {
    id: 331518,
    t: "Ботинки",
    s: "11kn",
    title: "Side Zip Chelsea Boots",
    cats: [269],
    colors: ["black"],
    sizes: SHOES,
    price: 12490,
    ru: ["42"],
    tags: ["minimal"],
  },
  {
    id: 331519,
    t: "Свитшот",
    s: "madwitch",
    title: "Faded Print Sweatshirt",
    cats: [68],
    colors: ["gray"],
    sizes: LETTERS,
    price: 6990,
    sale: 5590,
    tags: ["retro", "r1802"],
  },
  {
    id: 331520,
    t: "Джинсы",
    s: "blacklist",
    title: "Baggy Carpenter Jeans",
    cats: [64],
    colors: ["sky", "black"],
    sizes: ["28", "30", "32", "34"],
    price: 7990,
    soldOut: true,
    tags: ["street"],
  },
  {
    id: 331521,
    t: "Пуховик",
    s: "xj",
    title: "Cropped Puffer Jacket",
    cats: [213, 548],
    colors: ["black", "beige"],
    sizes: LETTERS,
    price: 19990,
    tags: ["tech", "r0104"],
  },
  {
    id: 331522,
    t: "Куртка",
    s: "mion",
    title: "City Series Stand Collar Shell Jacket",
    cats: [212],
    colors: ["dark-green"],
    sizes: LETTERS,
    price: 13490,
    soldOut: true,
    tags: ["tech"],
  },
  {
    id: 331523,
    t: "Кроссовки",
    s: "19",
    title: "Low Top Canvas Sneakers",
    cats: [271],
    colors: ["cream"],
    sizes: SHOES,
    price: 6990,
    ru: ["40", "41"],
    tags: ["minimal"],
  },
  {
    id: 331524,
    t: "Худи",
    s: "dazo",
    title: "Cropped Hoodie",
    cats: [163],
    colors: ["cream", "gray"],
    sizes: LETTERS_W,
    price: 7990,
    tags: ["street"],
  },
  {
    id: 331525,
    t: "Платье",
    s: "unfollow",
    title: "Asymmetric Slip Dress",
    cats: [160],
    colors: ["black"],
    sizes: LETTERS_W,
    price: 8990,
    tags: ["minimal"],
  },
  {
    id: 331526,
    t: "Юбка",
    s: "madwitch",
    title: "Pleated Mini Skirt",
    cats: [161],
    colors: ["black", "gray"],
    sizes: LETTERS_W,
    price: 5490,
    sale: 4390,
    tags: ["retro"],
  },
  {
    id: 331527,
    t: "Куртка",
    s: "11kn",
    title: "Cropped Denim Jacket",
    cats: [245],
    colors: ["sky"],
    sizes: LETTERS_W,
    price: 9990,
    ru: ["S"],
    tags: ["retro"],
  },
  {
    id: 331528,
    t: "Футболка",
    s: "dl",
    title: "Fitted Rib Tee",
    cats: [317],
    colors: ["white", "black", "brown"],
    sizes: LETTERS_W,
    price: 2490,
    tags: ["minimal"],
  },
  {
    id: 331529,
    t: "Брюки",
    s: "xj",
    title: "Wide Leg Tailored Trousers",
    cats: [164],
    colors: ["beige"],
    sizes: LETTERS_W,
    price: 7990,
    soldOut: true,
    tags: ["minimal"],
  },
  {
    id: 331530,
    t: "Пуховик",
    s: "19",
    title: "Long Quilted Down Coat",
    cats: [245, 548],
    colors: ["black"],
    sizes: LETTERS_W,
    price: 22990,
    priceMax: 23990,
    tags: ["minimal", "r0104"],
  },
  {
    id: 331531,
    t: "Кепка",
    s: "dl",
    title: "Washed Six Panel Cap",
    cats: [110],
    colors: ["black", "beige"],
    sizes: [],
    price: 2490,
    tags: ["street"],
  },
  {
    id: 331532,
    t: "Шапка",
    s: "madwitch",
    title: "Rib Knit Beanie",
    cats: [130],
    colors: ["gray", "black"],
    sizes: [],
    price: 1990,
    ru: [],
    tags: ["street"],
  },
  {
    id: 331533,
    t: "Кольцо",
    s: "blacklist",
    title: "316L Steel Signet Ring",
    cats: [81],
    colors: [],
    sizes: RINGS,
    price: 2990,
    tags: ["tech"],
  },
  {
    id: 331534,
    t: "Цепочка",
    s: "blacklist",
    title: "Cuban Link Chain",
    cats: [105],
    colors: [],
    sizes: [],
    price: 3490,
    tags: ["street"],
  },
  {
    id: 331535,
    t: "Ремень",
    s: "unfollow",
    title: "Leather Utility Belt",
    cats: [82],
    colors: ["black", "brown"],
    sizes: [],
    price: 3990,
    soldOut: true,
    tags: ["tech"],
  },
  {
    id: 331536,
    t: "Сумка",
    s: "xj",
    title: "Nylon Crossbody Bag",
    cats: [107],
    colors: ["black"],
    sizes: [],
    price: 5990,
    ru: [],
    tags: ["tech"],
  },
  {
    id: 331537,
    t: "Рюкзак",
    s: "mion",
    title: "Modular Tech Backpack",
    cats: [107],
    colors: ["black", "khaki"],
    sizes: [],
    price: 8990,
    tags: ["tech"],
  },
  {
    id: 331538,
    t: "Ботинки",
    s: "hq",
    title: "Deconstructed High Top Boxing Boots",
    cats: [269],
    colors: ["white"],
    sizes: SHOES,
    price: 13490,
    tags: ["tech", "r0104"],
    entities: true,
  },
  {
    id: 331539,
    t: "Кеды",
    s: "dazo",
    title: "Platform Canvas Sneakers",
    cats: [271, 58],
    colors: ["white", "black"],
    sizes: SHOES_UNISEX,
    price: 7490,
    tags: ["street"],
  },
  {
    id: 331540,
    t: "Свитер",
    s: "19",
    title: "Mohair Blend Cardigan",
    cats: [117],
    colors: ["wine", "cream"],
    sizes: LETTERS,
    price: 9990,
    ru: ["M", "L"],
    tags: ["retro"],
  },
  {
    id: 331541,
    t: "Шарф",
    s: "dl",
    title: "Black Soft Fringe Scarf",
    cats: [210],
    colors: ["black"],
    sizes: [],
    price: 1390,
    ru: [],
    tags: ["minimal"],
    entities: true,
  },
  {
    id: 331542,
    t: "Брюки",
    s: "hq",
    title: "Articulated Knee Cargo Pants",
    cats: [63],
    colors: ["black", "khaki", "gray"],
    sizes: LETTERS,
    price: 11490,
    tags: ["tech", "r1802"],
  },
];

/* ---------- Сборка ---------- */

const catById = new Map(
  CATEGORIES.map(([id, parent, slug, name]) => [id, { id, parent, slug, name }]),
);
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const sizeSlug = (s) => s.toLowerCase();

function image(productId, n, alt) {
  const file = ((productId + n) % 6) + 1;
  const src = `/placeholders/product-${file}.svg`;
  return {
    id: productId * 10 + n,
    src,
    thumbnail: src,
    srcset: "",
    sizes: "",
    name: `mock-${productId}-${n}`,
    alt,
  };
}

function term(id, name, slug) {
  return { id, name, slug, link: `${BASE}/?taxonomy&term=${slug}` };
}

function buildProduct(spec, index) {
  const [studioTagId, studioSlug, studioName] = STUDIOS[spec.s];
  const inner = `${studioName} ${spec.title}`;
  // Как на сайте: у части товаров кавычки приходят HTML-сущностями
  const name = spec.entities ? `${spec.t} &#171;${inner}&#187;` : `${spec.t} «${inner}»`;
  const slug = `${slugify(inner)}-dl-${14000 + index}`;
  const isRu = Array.isArray(spec.ru);
  const inStock = !spec.soldOut;

  const cats = [...spec.cats];
  if (isRu) cats.push(139);
  const categories = cats.map((id) => {
    const c = catById.get(id);
    if (!c) throw new Error(`Unknown category ${id} in ${spec.id}`);
    return term(c.id, c.name, c.slug);
  });

  const tags = [
    term(studioTagId, studioName, studioSlug),
    ...spec.tags.map((k) => {
      const [id, slug, tname] = COLLECTION_TAGS[k];
      return term(id, tname, slug);
    }),
  ];

  const attributes = [];
  if (spec.colors.length) {
    attributes.push({
      id: 3,
      name: "Цвет",
      taxonomy: "pa_color",
      has_variations: true,
      terms: spec.colors.map((c, i) => term(300 + i, COLORS[c], c)),
    });
  }
  if (spec.sizes.length) {
    attributes.push({
      id: 4,
      name: "Размер",
      taxonomy: "pa_size",
      has_variations: true,
      terms: spec.sizes.map((s, i) => term(400 + i, s, sizeSlug(s))),
    });
  }

  // Вариации: у «Товаров из России» остаются только непроданные размеры
  const variable = spec.colors.length > 0 || spec.sizes.length > 0;
  const sizesLeft = isRu && spec.sizes.length ? spec.ru : spec.sizes;
  const colorsLeft = isRu && spec.colors.length ? spec.colors.slice(0, 1) : spec.colors;
  const variations = [];
  let vid = spec.id * 100;
  for (const c of colorsLeft.length ? colorsLeft : [null]) {
    for (const s of sizesLeft.length ? sizesLeft : [null]) {
      const attrs = [];
      if (c) attrs.push({ name: "Цвет", value: c });
      if (s) attrs.push({ name: "Размер", value: sizeSlug(s) });
      if (attrs.length) variations.push({ id: ++vid, attributes: attrs });
    }
  }

  const price = spec.sale ?? spec.price;
  const priceRange = spec.priceMax
    ? { min_amount: String(price), max_amount: String(spec.priceMax) }
    : null;
  const altBase = `${studioName} ${spec.title}`;

  return {
    id: spec.id,
    name,
    slug,
    parent: 0,
    type: variable ? "variable" : "simple",
    variation: "",
    permalink: `${BASE}/product/${slug}/`,
    sku: `DL-${14000 + index}`,
    short_description: `<p>${spec.t} ${studioName}: ${spec.title.toLowerCase()}.</p>`,
    description: `<p>${spec.t} от ${studioName}. Плотные материалы, продуманный крой и детали, которые не встретишь в масс-маркете.</p><h3>Состав и уход</h3><p>Состав указан на бирке. Деликатная стирка при 30 °C, не отбеливать.</p><h3>Замеры</h3><p>Замеры конкретной модели уточняйте у поддержки.</p>`,
    on_sale: Boolean(spec.sale),
    prices: {
      price: String(price),
      regular_price: String(spec.price),
      sale_price: String(price),
      price_range: priceRange,
      currency_code: "RUB",
      currency_symbol: "₽",
      currency_minor_unit: 0,
      currency_decimal_separator: ".",
      currency_thousand_separator: " ",
      currency_prefix: "",
      currency_suffix: " ₽",
    },
    price_html: "",
    average_rating: index % 5 === 0 ? "5.00" : index % 3 === 0 ? "4.00" : "0",
    review_count: index % 5 === 0 ? 3 : index % 3 === 0 ? 1 : 0,
    images: [0, 1, 2].map((n) => image(spec.id, n, n === 0 ? altBase : "")),
    categories,
    tags,
    brands: [],
    attributes,
    variations,
    grouped_products: [],
    has_options: variable,
    is_purchasable: true,
    is_in_stock: inStock,
    is_on_backorder: false,
    low_stock_remaining: isRu && inStock ? 1 : null,
    sold_individually: false,
  };
}

const products = P.map(buildProduct).sort((a, b) => b.id - a.id); // как orderby=date desc

const counts = new Map();
for (const p of products) {
  const seen = new Set();
  for (const c of p.categories) {
    let cur = catById.get(c.id);
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      counts.set(cur.id, (counts.get(cur.id) ?? 0) + 1);
      cur = cur.parent ? catById.get(cur.parent) : undefined;
    }
  }
}
const categories = CATEGORIES.map(([id, parent, slug, name]) => ({
  id,
  name,
  slug,
  description: "",
  parent,
  count: counts.get(id) ?? 0,
  image: null,
  review_count: 0,
  permalink: `${BASE}/product-category/${slug}/`,
}));

const tagCounts = new Map();
for (const p of products)
  for (const t of p.tags) tagCounts.set(t.id, (tagCounts.get(t.id) ?? 0) + 1);
const tags = [...Object.values(STUDIOS), ...Object.values(COLLECTION_TAGS)].map(
  ([id, slug, name]) => ({
    id,
    name,
    slug,
    description: "",
    parent: 0,
    count: tagCounts.get(id) ?? 0,
  }),
);

const brandTerms = BRAND_TERMS.map(([id, slug, name]) => ({ id, name, slug, count: 0 }));

mkdirSync(OUT, { recursive: true });
const write = (file, data) => writeFileSync(join(OUT, file), JSON.stringify(data, null, 2) + "\n");
write("products.json", products);
write("categories.json", categories);
write("tags.json", tags);
write("brand-terms.json", brandTerms);
console.log(`products: ${products.length}, categories: ${categories.length}, tags: ${tags.length}`);
