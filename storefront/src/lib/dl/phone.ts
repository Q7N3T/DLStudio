/** Телефон РФ: маска «+7 (999) 123-45-67», нормализация и проверка */

/** 10 значащих цифр номера (без +7/8) */
export function phoneDigits(input: string): string {
  const raw = input.trim()
  // «+7…» — код страны, а не первая цифра номера
  let d = (raw.startsWith("+7") ? raw.slice(2) : raw).replace(/\D/g, "")
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) d = d.slice(1)
  return d.slice(0, 10)
}

/** Разделители ставим только после следующей цифры — иначе Backspace «застревает» на них */
export function formatPhone(input: string): string {
  const d = phoneDigits(input)
  if (!d) return ""
  let out = "+7 (" + d.slice(0, 3)
  if (d.length > 3) out += ") " + d.slice(3, 6)
  if (d.length > 6) out += "-" + d.slice(6, 8)
  if (d.length > 8) out += "-" + d.slice(8, 10)
  return out
}

/** Значение поля при вводе: первая «+», «7» или «8» сразу превращаются в «+7 (» */
export function maskPhoneInput(raw: string, previous: string): string {
  if (!previous && /^(\+|\+7|7|8)$/.test(raw.trim())) return "+7 ("
  return formatPhone(raw)
}

export function isValidPhone(input: string): boolean {
  return phoneDigits(input).length === 10
}

/** В Medusa храним в E.164: +79991234567 */
export function toE164(input: string): string {
  return `+7${phoneDigits(input)}`
}
