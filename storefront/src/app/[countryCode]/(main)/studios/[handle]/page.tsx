import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStudio } from "@lib/data/studios"
import { CatalogView } from "@modules/dl/catalog/catalog-view"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const studio = await getStudio(handle)
  if (!studio) notFound()
  return {
    title: `${studio.name} — студия`,
    description: studio.description || `Одежда и аксессуары ${studio.name} напрямую от студии в DL Studio.`,
  }
}

/** Страница студии: обложка (если есть), пара строк о студии и её товары с фильтрами */
export default async function StudioPage(props: Props) {
  const { handle, countryCode } = await props.params
  const studio = await getStudio(handle)
  if (!studio) notFound()
  return (
    <CatalogView
      countryCode={countryCode}
      basePath={`/${countryCode}/studios/${handle}`}
      title={studio.name}
      description={studio.description}
      scope={{ studio: handle }}
      searchParams={await props.searchParams}
      crumbs={[
        { href: `/${countryCode}/store`, label: "Каталог" },
        { href: `/${countryCode}/studios`, label: "Студии" },
      ]}
    />
  )
}
