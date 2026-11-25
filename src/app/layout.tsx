import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/config/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/** Широкий акцидентный — только для логотипа и заголовков релизов. */
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "DL Studio — одежда независимых студий из Китая",
    template: "%s — DL Studio",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
