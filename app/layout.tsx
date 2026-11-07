import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { siteConfig } from "@/lib/tours";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} — Bali white water rafting`,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    "Telaga Waja Rafting in Karangasem, Bali. 14 km of Class II–III rapids, jungle canyon scenery and the famous finish drop. Book by WhatsApp.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Bali white water rafting`,
    description:
      "14 km of Class II–III rapids in Karangasem, Bali. Book by WhatsApp.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-river-950">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
