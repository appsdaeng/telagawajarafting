import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/tours";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Telaga Waja Rafting Bali | Book Online",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "White water rafting on the Telaga Waja river, Karangasem, Bali. 14 km of Class II–III rapids with guide, equipment, lunch and hotel pickup included.",
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    title: "Telaga Waja Rafting Bali | Book Online",
    description:
      "14 km of Class II–III rapids in Karangasem, Bali. Guide, lunch and hotel pickup included.",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Root layout is deliberately just the document. The public chrome lives in
 * `app/(site)/layout.tsx` so `/admin` renders a dashboard shell instead of the
 * marketing header and footer.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-river-950">{children}</body>
    </html>
  );
}
