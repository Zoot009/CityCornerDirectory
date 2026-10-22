import type { Metadata } from "next";
import { Albert_Sans, Urbanist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

// Urbanist (heavy, tight) for headings, Albert Sans for everything else.
const albert = Albert_Sans({ variable: "--font-albert", subsets: ["latin"] });
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"] });

// Pages render on first visit and are cached for a day, then refreshed in the background.
export const revalidate = 86400;

// No canonical here: every page sets its own (lib/site.ts pageMeta), so none can inherit the homepage's.
export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: { default: `${SITE_NAME}: the best-loved spots on every corner`, template: `%s · ${SITE_NAME}` },
  description:
    "Cafés, dentists, salons, plumbers and more, city by city and corner by corner. Ranked by real ratings and review counts. Free to use, free to list.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${albert.variable} ${urbanist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
