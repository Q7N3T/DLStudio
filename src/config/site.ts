export const site = {
  name: "DL Studio",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dlstudio.store",
  description:
    "Одежда, обувь и аксессуары независимых китайских студий напрямую от производителей. Индивидуальность интереснее, чем тренды.",
  support: {
    telegram: "https://t.me/dlstudiosupport",
    vk: "https://vk.me/dlstudioshop",
    /** Обещание в блоке доверия на карточке товара */
    responseTime: "~5 минут",
  },
  social: {
    telegram: "https://t.me/dlstudiosupport",
    vk: "https://vk.com/dlstudioshop",
  },
} as const;
