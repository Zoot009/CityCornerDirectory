import type { MetadataRoute } from "next";
import { generateSitemaps } from "@/app/sitemap";
import { absoluteUrl } from "@/lib/site";

// Search and form pages stay crawlable so crawlers can see their noindex tag.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const files = await generateSitemaps();
  return { rules: { userAgent: "*", allow: "/" }, sitemap: files.map(({ id }) => absoluteUrl(`/sitemap/${id}.xml`)) };
}
