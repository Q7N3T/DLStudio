import { Metadata } from "next"
import { CatalogView } from "@modules/dl/catalog/catalog-view"

export const metadata: Metadata = {
  title: "Каталог",
  description: "Одежда, обувь и аксессуары независимых студий из Китая — с фильтрами по размеру, цене, студии и сроку доставки.",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function StorePage(props: Props) {
  const { countryCode } = await props.params
  return (
    <CatalogView
      countryCode={countryCode}
      basePath={`/${countryCode}/store`}
      title="Каталог"
      scope={{}}
      searchParams={await props.searchParams}
    />
  )
}
