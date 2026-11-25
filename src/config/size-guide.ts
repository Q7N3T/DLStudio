/**
 * Общие ориентиры для таблицы размеров.
 * ВНИМАНИЕ: значения типовые и требуют сверки с владельцем. У каждой студии своё
 * лекало и колодка, поэтому точные цифры по конкретной модели — в блоке «Замеры».
 */

export const CLOTHING_SIZES = [
  { size: "XS", chest: "84–88", waist: "68–72", hips: "88–92" },
  { size: "S", chest: "88–92", waist: "72–76", hips: "92–96" },
  { size: "M", chest: "92–96", waist: "76–80", hips: "96–100" },
  { size: "L", chest: "96–100", waist: "80–84", hips: "100–104" },
  { size: "XL", chest: "100–104", waist: "84–88", hips: "104–108" },
  { size: "XXL", chest: "104–110", waist: "88–94", hips: "108–114" },
] as const;

/** Длина стопы (см) → размер EU. */
export const SHOE_SIZES = [
  { size: "35", footCm: 22.5 },
  { size: "36", footCm: 23 },
  { size: "37", footCm: 23.5 },
  { size: "38", footCm: 24 },
  { size: "39", footCm: 24.5 },
  { size: "40", footCm: 25 },
  { size: "41", footCm: 25.5 },
  { size: "42", footCm: 26 },
  { size: "43", footCm: 26.5 },
  { size: "44", footCm: 27 },
  { size: "45", footCm: 27.5 },
  { size: "46", footCm: 28 },
] as const;

export const HOW_TO_MEASURE = {
  clothing: [
    { label: "Грудь", text: "По самой выступающей части груди, лента горизонтально." },
    { label: "Талия", text: "По самой узкой части, без втягивания живота." },
    { label: "Бёдра", text: "По самой широкой части ягодиц, ноги вместе." },
  ],
  shoes: [
    {
      label: "Длина стопы",
      text: "Встаньте на лист бумаги, отметьте пятку и самый длинный палец, измерьте расстояние. Вечером стопа чуть больше — меряйте вечером.",
    },
  ],
} as const;

/**
 * Подбор размера обуви по длине стопы: берём первый размер, у которого
 * длина стельки не меньше стопы. null — если вне таблицы.
 */
export function shoeSizeForFoot(footCm: number): string | null {
  if (!Number.isFinite(footCm) || footCm <= 0) return null;
  const match = SHOE_SIZES.find((s) => s.footCm >= footCm - 0.0001);
  return match?.size ?? null;
}
