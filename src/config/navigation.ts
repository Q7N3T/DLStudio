/** Ссылки шапки, футера и таб-бара в одном месте. */

export const mainNav = [
  { href: "/catalog?sort=new", label: "Новинки" },
  { href: "/catalog", label: "Каталог" },
  // На сайте нет единого тега релизов (есть release-010426, release-1802 …) —
  // своя страница-агрегатор, собирается на этапе 4.
  { href: "/releases", label: "Релизы" },
  { href: "/about-the-studios", label: "Студии" },
  { href: "/product-category/warehouse-in-russia", label: "Из России" },
] as const;

export const footerNav = [
  {
    title: "Покупателям",
    links: [
      { href: "/help", label: "Помощь" },
      { href: "/delivery", label: "Доставка" },
      { href: "/returns", label: "Возврат и обмен" },
      { href: "/size-guide", label: "Выбор размера" },
      { href: "/track", label: "Где мой заказ" },
    ],
  },
  {
    title: "DL Studio",
    links: [
      { href: "/about", label: "О нас" },
      { href: "/about-the-studios", label: "Студии" },
      { href: "/contacts", label: "Контакты" },
    ],
  },
] as const;
