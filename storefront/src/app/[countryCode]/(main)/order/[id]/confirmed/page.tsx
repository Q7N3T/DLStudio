import { retrieveOrder } from "@lib/data/orders"
import { OrderConfirmed } from "@modules/dl/order/order-confirmed"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string; countryCode: string }>
}

export const metadata: Metadata = {
  title: "Заказ оформлен",
  robots: { index: false, follow: false },
}

export default async function OrderConfirmedPage(props: Props) {
  const { id, countryCode } = await props.params
  const order = await retrieveOrder(id).catch(() => null)
  if (!order) return notFound()
  return <OrderConfirmed order={order} countryCode={countryCode} />
}
