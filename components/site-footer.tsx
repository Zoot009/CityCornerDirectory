import Link from "next/link";
import { Logo } from "@/components/site-header";
import { getCategories, getCities } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";
import { categoryHref } from "@/lib/utils";

// One big mocha tile to close every page.
export async function SiteFooter() {
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);
  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/categories", label: "Every category" },
        { href: "/cities", label: "Every city" },
        { href: "/search", label: "Search" },
      ],
    },
    { title: "Cities", links: cities.slice(0, 6).map((c) => ({ href: `/${c.slug}`, label: c.name })) },
    {
      title: "Popular corners",
      links: [...categories]
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)
        .map((c) => ({ href: categoryHref(c.name), label: c.name })),
    },
    {
      title: "For owners",
      links: [
        { href: "/for-businesses", label: "Why list with us" },
        { href: "/claim", label: "Claim your page" },
        { href: "/add-a-business", label: "Add a business" },
      ],
    },
    {
      title: "About us",
      links: [
        { href: "/about", label: "Our story" },
        { href: "/about#rankings", label: "How we rank" },
        { href: "/about#guidelines", label: "Review rules" },
        { href: "/about#contact", label: "Get in touch" },
      ],
    },
  ];

  return (
    <footer className="mt-24 px-3 pb-3">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo onDark />
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/75">
              Every corner of the city, ranked by the people who go there. Free to use, free to list.
            </p>
            <Link href="/add-a-business" className="mt-5 inline-flex rounded-full bg-butter px-5 py-2.5 text-sm font-bold text-foreground hover:bg-peach">
              Add a business
            </Link>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-display font-extrabold text-butter">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-primary-foreground/80 underline-offset-4 hover:text-primary-foreground hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} {SITE_NAME}. No ads, no paid rankings: ratings come from customers, and each business runs its own
          service.
        </p>
      </div>
    </footer>
  );
}
