/**
 * Сроки доставки по типу склада. Меняются здесь — расходятся по всей витрине
 * (бейджи в каталоге, блок на карточке товара, корзина, оформление).
 *
 * Тип определяется категорией WooCommerce: товары в категории
 * `warehouse-in-russia` («Товары из России») — со склада в России, остальные — из Китая.
 */
export type DeliveryType = "russia" | "china";

export interface DeliveryOption {
  type: DeliveryType;
  /** Короткая подпись для бейджа */
  label: string;
  minDays: number;
  maxDays: number;
}

export const DELIVERY: Record<DeliveryType, DeliveryOption> = {
  russia: { type: "russia", label: "Из России", minDays: 3, maxDays: 5 },
  china: { type: "china", label: "Из Китая", minDays: 14, maxDays: 25 },
};

/** Слаг категории WooCommerce, по которой товар считается «из России». */
export const RUSSIA_CATEGORY_SLUG = "warehouse-in-russia";
