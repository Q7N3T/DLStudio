import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listCategoryNodes } from "@lib/data/catalog-tree"
import { CatalogView } from "@modules/dl/catalog/catalog-view"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Handle категорий плоские (как на сайте), путь /categories/man/top-man — берём последний сегмент */
async function findCategory(segments: string[]) {
  const handle = segments[segments.length - 1]
  const all = await listCategoryNodes()
  const category = all.find((c) => c.handle === handle)
  if (!category) return null
  const chain = []
  let cur: typeof category | undefined = category
  while (cur) {
    chain.unshift(cur)
    cur = cur.parent_category_id ? all.find((c) => c.id === cur!.parent_category_id) : undefined
  }
  return { category, chain }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category } = await props.params
  const found = await findCategory(category)
  if (!found) notFound()
  const { category: c, chain } = found
  const title = chain.length > 1 ? `${c.name} — ${chain[0].name.toLowerCase()}` : c.name
  return {
    title,
    description: c.description || `${c.name} от независимых студий из Китая в DL Studio.`,
  }
}

export default async function CategoryPage(props: Props) {
  const { category, countryCode } = await props.params
  const found = await findCategory(category)
  if (!found) notFound()
  const { category: c, chain } = found
  return (
    <CatalogView
      countryCode={countryCode}
      basePath={`/${countryCode}/categories/${c.handle}`}
      title={c.name}
      description={c.description}
      scope={{ category: c.handle }}
      searchParams={await props.searchParams}
      crumbs={[
        { href: `/${countryCode}/store`, label: "Каталог" },
        ...chain.slice(0, -1).map((x) => ({ href: `/${countryCode}/categories/${x.handle}`, label: x.name })),
      ]}
    />
  )
}
