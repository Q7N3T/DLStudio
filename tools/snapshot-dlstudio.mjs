#!/usr/bin/env node
/**
 * Снимок реального каталога dlstudio.store для сидов Medusa.
 *
 *   node tools/snapshot-dlstudio.mjs [--limit 72]
 *
 * Только чтение публичного WooCommerce Store API (без ключей, без записи).
 * Сохраняет backend/src/lib/seed/data/dlstudio-snapshot.json:
 *   - дерево категорий, студии (термины «Студия» ↔ теги), подборки и релизы;
 *   - репрезентативный набор товаров: все разделы, оба склада, скидки, распроданное;
 *   - «нижнюю часть» карточки, разобранную из HTML описания по блокам
 *     (описание, сезон, параметры моделей, таблица замеров, состав, уход, доп. характеристики).
 * Изображения не скачиваются — в снимке остаются ссылки на dlstudio.store.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const API = "https://dlstudio.store/wp-json/wc/store/v1"
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "backend", "src", "lib", "seed", "data", "dlstudio-snapshot.json")
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || 72
const RUSSIA = "warehouse-in-russia"
const SKIP_CATEGORIES = new Set(["gift-voucher"])
const COLLECTION_TAGS = ["streetwear-essentials", "minimalist-chic", "techwear-vibes", "retro-vibes"]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(API + path, { headers: { accept: "application/json", "user-agent": "dlstudio-snapshot/1.0" } })
    if (res.ok) return res.json()
    if (attempt === 3) throw new Error(`${res.status} ${path}`)
    await sleep(1000 * attempt)
  }
}
async function getAll(path) {
  const out = []
  for (let page = 1; page < 50; page++) {
    const sep = path.includes("?") ? "&" : "?"
    const batch = await get(`${path}${sep}per_page=100&page=${page}`)
    out.push(...batch)
    if (batch.length < 100) break
    await sleep(300)
  }
  return out
}

/* ── HTML → текст ─────────────────────────────────────────────────────── */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", ndash: "–", mdash: "—", hellip: "…", deg: "°" }
export const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) =>
    c[0] === "#" ? String.fromCodePoint(c[1].toLowerCase() === "x" ? parseInt(c.slice(2), 16) : +c.slice(1)) : ENT[c.toLowerCase()] ?? m
  )
const strip = (h) => decode(h.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").trim()

function parseTable(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)].map((td) => strip(td[0]).replace(/\n+/g, " "))
  )
  const clean = rows.filter((r) => r.some(Boolean))
  if (clean.length < 2) return null
  return { columns: clean[0], rows: clean.slice(1) }
}

/** Разбор «нижней части» карточки из HTML описания WooCommerce. */
export function parseDescription(htmlIn) {
  const details = { paragraphs: [], season: null, model_params: [], size_chart: null, size_chart_note: null, composition: [], care: null, temperature: null, features: [] }
  let h = htmlIn.replace(/\r/g, "")
  // Таблица замеров (WP Table Builder или обычная <table>)
  const table = h.match(/<table[\s\S]*?<\/table>/i)
  if (table) {
    details.size_chart = parseTable(table[0])
    h = h.replace(/<div class="wptb-container[\s\S]*?<\/table>\s*<\/div>/i, "\n").replace(/<table[\s\S]*?<\/table>/i, "\n")
  }
  const blocks = h.split(/<\/p>|<p[^>]*>|\n{2,}/i).map(strip).filter(Boolean)
  let inComposition = false
  let inCare = false
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    for (const line of lines.length ? lines : [block]) {
      if (/^Доставка этого товара/i.test(line)) continue // срок считает витрина
      if (/^Коллекция /i.test(line)) { details.season = line.replace(/\.$/, ""); inComposition = false; continue }
      if (/^Параметры моделей/i.test(line)) { inComposition = false; continue }
      if (/^(Парень|Девушка|Модель)\s*[–—-]/i.test(line)) { details.model_params.push(line); continue }
      if (/^Таблица замеров/i.test(line)) { details.size_chart_note = line.replace(/^Таблица замеров изделия\.\s*/i, "") || null; inComposition = false; continue }
      if (/^Состав\s*:/i.test(line)) { const v = line.replace(/^Состав\s*:\s*/i, ""); if (v) details.composition.push(v); inComposition = true; continue }
      if (/^(Рекомендации по уходу|Уход)\s*:/i.test(line)) { details.care = line.replace(/^(Рекомендации по уходу|Уход)\s*:\s*/i, ""); inComposition = false; inCare = true; continue }
      if (inCare && /^[—–-]\s*/.test(line)) {
        // Уход списком: «— Очищайте…— Не сушите…» (иногда без переноса строки)
        const items = line.split(/\s*[—–]\s+/).map((x) => x.replace(/^[—–-]\s*/, "").trim()).filter(Boolean)
        details.care = [details.care, ...items].filter(Boolean).join(" ")
        continue
      }
      if (/повторный замер/i.test(line)) { details.size_chart_note = [details.size_chart_note, line].filter(Boolean).join(" "); continue }
      if (/^Температурный режим\s*:/i.test(line)) { details.temperature = line.replace(/^Температурный режим\s*:\s*/i, ""); continue }
      if (inComposition && /^(Верх|Подкладка|Стелька|Подошва|Наполнитель|Утеплитель|Основа|Отделка)\s*:/i.test(line)) { details.composition.push(line); continue }
      const kv = line.match(/^([А-ЯЁ][^:]{2,40}):\s*(.+)$/)
      if (kv && details.composition.length) { details.features.push({ label: kv[1].trim(), value: kv[2].trim() }); continue }
      // Хвост таблицы, превращённой в текст («Грудь Плечи … S 116 …») без <table> — пропускаем
      if (/^(Грудь|Длина стопы|Размер)\b.*\d/.test(line) && !details.size_chart) continue
      details.paragraphs.push(line)
    }
  }
  return details
}

/* ── Выбор товаров ────────────────────────────────────────────────────── */
function pickRepresentative(all, categories, limit) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const leafOf = (p) => {
    const cats = p.categories.filter((c) => c.slug !== RUSSIA && !SKIP_CATEGORIES.has(c.slug))
    return cats.sort((a, b) => depth(b.id) - depth(a.id))[0]?.slug ?? "other"
  }
  const depth = (id) => { let d = 0, c = byId.get(id); while (c) { d++; c = c.parent ? byId.get(c.parent) : null } return d }
  const isRu = (p) => p.categories.some((c) => c.slug === RUSSIA)

  const picked = new Map()
  const isReal = (p) => p.images.length > 0 && p.categories.length > 0 && !/тестов/i.test(p.name)
  const add = (p) => { if (picked.size < limit && !picked.has(p.id) && isReal(p)) picked.set(p.id, p) }
  // 1) Склад в России: 14 товаров в наличии из разных категорий
  const ruSeen = new Set()
  for (const p of all.filter((p) => isRu(p) && p.is_in_stock)) { if (picked.size >= 14) break; if (!ruSeen.has(leafOf(p))) { ruSeen.add(leafOf(p)); add(p) } }
  // 2) Распроданное (из России и из Китая) и скидки
  all.filter((p) => !p.is_in_stock && isRu(p)).slice(0, 2).forEach(add)
  all.filter((p) => !p.is_in_stock && !isRu(p)).slice(0, 2).forEach(add)
  all.filter((p) => p.on_sale && p.is_in_stock && !isRu(p)).slice(0, 6).forEach(add)
  // 3) По 2 товара на каждую листовую категорию из Китая, по кругу
  const buckets = new Map()
  for (const p of all.filter((p) => !isRu(p) && p.is_in_stock)) {
    const k = leafOf(p); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(p)
  }
  for (let round = 0; round < 3 && picked.size < limit; round++) for (const list of buckets.values()) if (list[round]) add(list[round])
  return [...picked.values()]
}

/* ── Main ─────────────────────────────────────────────────────────────── */
const toSlugMap = (attr) => new Map((attr?.terms ?? []).map((t) => [t.slug, decode(t.name)]))

console.log("Категории, студии, теги…")
const categories = (await getAll("/products/categories")).filter((c) => !SKIP_CATEGORIES.has(c.slug))
const brandTerms = await getAll("/products/attributes/5/terms")
const tags = await getAll("/products/tags")
// Студии — термины атрибута «Студия»; handle берём у одноимённого тега (адреса /product-tag/<slug>/),
// а если тега нет — у самого термина
const tagByName = new Map(tags.map((t) => [decode(t.name).toLowerCase(), t]))
const studios = brandTerms
  .filter((t) => !/^other studios$/i.test(decode(t.name)))
  .map((t) => ({ handle: tagByName.get(decode(t.name).toLowerCase())?.slug ?? t.slug, name: decode(t.name) }))
const studioByName = new Map(studios.map((s) => [s.name.toLowerCase(), s]))
const allStudios = [...studios].sort((a, b) => b.name.length - a.name.length)

console.log("Товары (последние 600 и склад в России)…")
const recent = []
for (let page = 1; page <= 6; page++) { recent.push(...(await get(`/products?per_page=100&page=${page}&orderby=date&order=desc`))); await sleep(300) }
const russia = await getAll(`/products?category=${RUSSIA}`)
const all = [...new Map([...recent, ...russia].map((p) => [p.id, p])).values()]
const chosen = pickRepresentative(all, categories, LIMIT)

const products = chosen.map((p) => {
  const name = decode(p.name)
  const inner = (name.match(/[«“"](.+)[»”"]/)?.[1] ?? name).toLowerCase()
  const studio =
    p.tags.map((t) => studioByName.get(decode(t.name).toLowerCase())).find(Boolean) ??
    // Тег студии иногда не проставлен — ищем по началу названия («Hualun …» → «Hualun Studio»)
    allStudios.find((s) => inner.startsWith(s.name.toLowerCase() + " ") || inner.startsWith(s.name.toLowerCase().replace(/ studio$/, "") + " ")) ??
    null
  const colorAttr = p.attributes.find((a) => /^цвет$/i.test(a.name))
  const sizeAttr = p.attributes.find((a) => /^размер$/i.test(a.name))
  const colorNames = toSlugMap(colorAttr)
  const sizeNames = toSlugMap(sizeAttr)
  const m = name.match(/^(.*?)\s*[«“"](.+)[»”"]\s*$/)
  let title = m?.[2] ?? name
  if (studio && title.toLowerCase().startsWith(studio.name.toLowerCase() + " ")) title = title.slice(studio.name.length).trim()
  const minor = p.prices.currency_minor_unit
  const rub = (v) => Math.round(Number(v) / 10 ** minor)
  return {
    ref: p.id,
    slug: p.slug,
    sku: p.sku,
    name,
    type: m?.[1]?.trim() || null,
    title,
    studio: studio?.handle ?? null,
    categories: p.categories.map((c) => c.slug).filter((s) => s !== RUSSIA && !SKIP_CATEGORIES.has(s)),
    russia: p.categories.some((c) => c.slug === RUSSIA),
    collections: p.tags.map((t) => t.slug).filter((s) => COLLECTION_TAGS.includes(s)),
    releases: p.tags.map((t) => t.slug).filter((s) => s.startsWith("release-")),
    in_stock: p.is_in_stock,
    price: rub(p.prices.regular_price) || rub(p.prices.price),
    sale_price: p.on_sale && rub(p.prices.price) < rub(p.prices.regular_price) ? rub(p.prices.price) : null,
    colors: [...colorNames].map(([slug, label]) => ({ slug, name: label })),
    sizes: [...sizeNames.values()],
    // Существующие вариации = доступные сочетания (Store API не отдаёт остатки вариаций в списке)
    variations: p.variations.map((v) => ({
      color: v.attributes.find((a) => /^цвет$/i.test(a.name))?.value || null,
      size: (() => { const s = v.attributes.find((a) => /^размер$/i.test(a.name))?.value; return s ? sizeNames.get(s) ?? s : null })(),
    })),
    images: p.images.map((img) => ({ url: img.src, alt: decode(img.alt || "") })),
    details: parseDescription(p.description || ""),
    permalink: p.permalink,
  }
})

const usedCategorySlugs = new Set(products.flatMap((p) => p.categories))
const parentOf = new Map(categories.map((c) => [c.slug, categories.find((x) => x.id === c.parent)?.slug ?? null]))
// Нужны все предки используемых категорий
for (const slug of [...usedCategorySlugs]) { let s = parentOf.get(slug); while (s) { usedCategorySlugs.add(s); s = parentOf.get(s) } }

const snapshot = {
  source: "https://dlstudio.store/wp-json/wc/store/v1",
  taken_at: new Date().toISOString().slice(0, 10),
  categories: categories
    .filter((c) => c.slug !== RUSSIA && c.slug !== "final-winter-edit")
    .map((c) => ({ handle: c.slug, name: decode(c.name), parent: parentOf.get(c.slug), description: strip(c.description || "") || null, used: usedCategorySlugs.has(c.slug) })),
  studios: studios.filter((s) => products.some((p) => p.studio === s.handle)),
  products,
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n")
const n = (f) => products.filter(f).length
console.log(`Готово: ${products.length} товаров (Россия ${n((p) => p.russia)}, распродано ${n((p) => !p.in_stock)}, скидка ${n((p) => p.sale_price)}, без студии ${n((p) => !p.studio)}), студий ${snapshot.studios.length}, категорий ${snapshot.categories.length}`)
console.log(`→ ${OUT}`)
