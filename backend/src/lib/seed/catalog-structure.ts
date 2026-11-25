import type { SnapshotCategory } from "./snapshot"

/**
 * Справочники каталога для сидов. Категории и студии берутся из снимка сайта
 * (handle = слаги dlstudio.store, чтобы сохранить адреса /product-category/<handle>/),
 * коллекции — тематические подборки и Final Winter Edit.
 */

export const SEED_COLLECTIONS = [
  { handle: "final-winter-edit", title: "Final Winter Edit" },
  { handle: "streetwear-essentials", title: "Streetwear Essentials" },
  { handle: "minimalist-chic", title: "Minimalist Chic" },
  { handle: "techwear-vibes", title: "Techwear Vibes" },
  { handle: "retro-vibes", title: "Retro Vibes" },
]

/** Категория-«склад» и категория-подборка на сайте — в Medusa это склад и коллекция */
export const NON_CATEGORY_SLUGS = new Set(["warehouse-in-russia", "final-winter-edit"])

/**
 * Категории, нужные товарам снимка, в порядке «родитель раньше детей».
 * Пустые ветки не создаём — на витрине они выглядели бы как пустые разделы.
 */
export function orderedCategories(categories: SnapshotCategory[]): SnapshotCategory[] {
  const used = categories.filter((c) => c.used)
  const byHandle = new Map(used.map((c) => [c.handle, c]))
  const depth = (c: SnapshotCategory): number => {
    let d = 0
    let cur: SnapshotCategory | undefined = c
    const seen = new Set<string>()
    while (cur?.parent && byHandle.has(cur.parent) && !seen.has(cur.handle)) {
      seen.add(cur.handle)
      d++
      cur = byHandle.get(cur.parent)
    }
    return d
  }
  return [...used].sort((a, b) => depth(a) - depth(b))
}
