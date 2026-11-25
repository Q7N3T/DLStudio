import { Metadata } from "next"
import { FavoritesView } from "@modules/dl/catalog/favorites-view"

export const metadata: Metadata = {
  title: "Избранное",
  robots: { index: false, follow: true },
}

export default async function FavoritesPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  return <FavoritesView countryCode={countryCode} />
}
