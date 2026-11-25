import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Manrope, Unbounded } from "next/font/google"
import "styles/globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

/** Широкий акцидентный — только логотип и заголовки релизов */
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "DL Studio — одежда независимых студий из Китая",
    template: "%s — DL Studio",
  },
  description:
    "Одежда, обувь и аксессуары независимых студий из Китая напрямую от производителей. Индивидуальность интереснее, чем тренды.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "DL Studio" },
}

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-mode="light" className={`${manrope.variable} ${unbounded.variable}`}>
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
