import type { MetadataRoute } from "next";
import { businessPath, getBusinessSlugs, getCities, getListingPaths, getStats, SITEMAP_SIZE } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// Indexable pages only (search and form pages are noindex). File 0 holds the site, cities and lists;
// the rest hold businesses, SITEMAP_SIZE at a time. robots.txt lists every file.
export async function generateSitemaps() {
  const { businesses } = await getStats();
  return Array.from({ length: 1 + Math.ceil(businesses / SITEMAP_SIZE) }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const paths =
    id === 0
      ? ["/", "/categories", "/cities", "/for-businesses", "/about", ...(await getCities()).map((c) => `/${c.slug}`), ...(await getListingPaths())]
      : (await getBusinessSlugs(id - 1)).map((slug) => businessPath({ slug }));
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
