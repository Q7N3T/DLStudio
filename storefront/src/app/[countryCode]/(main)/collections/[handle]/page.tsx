import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCollectionByHandle } from "@lib/data/collections"
import { CatalogView } from "@modules/dl/catalog/catalog-view"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const collection = await getCollectionByHandle(handle)
  if (!collection) notFound()
  return { title: collection.title, description: `Подборка «${collection.title}» в DL Studio.` }
}

export default async function CollectionPage(props: Props) {
  const { handle, countryCode } = await props.params
  const collection = await getCollectionByHandle(handle)
  if (!collection) notFound()
  return (
    <CatalogView
      countryCode={countryCode}
      basePath={`/${countryCode}/collections/${handle}`}
      title={collection.title}
      scope={{ collection: handle }}
      searchParams={await props.searchParams}
      crumbs={[{ href: `/${countryCode}/store`, label: "Каталог" }]}
    />
  )
}
