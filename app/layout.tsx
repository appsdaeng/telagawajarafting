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
    default: "Telaga Waja Rafting Bali – No Stairs, Easy Access Adventure",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Experience Telaga Waja Rafting Bali with exciting rapids, jungle scenery and easy river access. Enjoy a long rafting adventure without the steep stair climb.",
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    title: "Telaga Waja Rafting Bali – No Stairs, Easy Access Adventure",
    description:
      "Telaga Waja rafting adventure with easy access at both the starting and finishing points. No long, exhausting stair climbs—just more time to enjoy Bali’s rapids, jungle scenery and waterfalls.",
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
