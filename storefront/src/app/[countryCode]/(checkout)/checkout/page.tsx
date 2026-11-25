import { retrieveCart } from "@lib/data/cart"
import { calculatePriceForShippingOption, listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { CART_FIELDS } from "@lib/dl/cart"
import { CheckoutView, type CarrierOption } from "@modules/dl/checkout/checkout-view"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
}

/** Сроки и подписи перевозчиков — те же, что в тарифах backend (dlstudio-shipping) */
const CARRIER_INFO: Record<string, { description: string; days: string; order: number }> = {
  cdek: { description: "До пункта выдачи СДЭК", days: "3–7 дней", order: 0 },
  "russian-post": { description: "До отделения Почты России", days: "7–14 дней", order: 1 },
}
const carrierOrder = (code: string) => CARRIER_INFO[code]?.order ?? 99

export default async function CheckoutPage(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const cart = await retrieveCart(undefined, CART_FIELDS)
  if (!cart || !cart.items?.length) redirect(`/${countryCode}/cart`)

  const [shippingOptions, paymentProviders] = await Promise.all([
    listCartShippingMethods(cart.id),
    cart.region_id ? listCartPaymentMethods(cart.region_id) : Promise.resolve([]),
  ])

  // Цена «calculated» зависит от корзины (бесплатно от порога) — считаем на сервере для каждого варианта
  const carriers: CarrierOption[] = await Promise.all(
    (shippingOptions ?? []).map(async (o) => {
      const code = String((o.data as Record<string, unknown> | null)?.carrier ?? o.type?.code ?? o.id)
      let amount: number | null = o.amount ?? null
      if (o.price_type === "calculated") {
        const calc = await calculatePriceForShippingOption(o.id, cart.id)
        amount = calc?.amount ?? null
      }
      return {
        id: o.id,
        code,
        name: o.name,
        description: CARRIER_INFO[code]?.description ?? o.type?.description ?? "",
        days: CARRIER_INFO[code]?.days ?? "",
        amount,
      }
    })
  )

  return (
    <CheckoutView
      cart={cart}
      carriers={carriers.filter((c) => c.amount !== null).sort((a, b) => carrierOrder(a.code) - carrierOrder(b.code))}
      paymentProviders={(paymentProviders ?? []).map((p) => p.id)}
    />
  )
}
