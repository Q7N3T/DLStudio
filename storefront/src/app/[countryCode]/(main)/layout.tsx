import { Metadata } from "next"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import { SiteFooter } from "@modules/dl/layout/site-footer"
import { SiteHeader } from "@modules/dl/layout/site-header"
import { TabBar } from "@modules/dl/layout/tab-bar"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])
  const cartCount = (cart?.items ?? []).reduce((n, i) => n + (i.quantity ?? 0), 0)

  return (
    <>
      <SiteHeader countryCode={countryCode} cartCount={cartCount} />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      <div id="main">{props.children}</div>
      <SiteFooter countryCode={countryCode} />
      <TabBar cartCount={cartCount} />
    </>
  )
}
