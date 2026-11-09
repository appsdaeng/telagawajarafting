import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s · Telaga Waja Portal" },
  robots: { index: false, follow: false, nocache: true },
};

/** The portal is never indexed and never renders the marketing chrome. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-sand-50/50 text-river-950">{children}</div>;
}
