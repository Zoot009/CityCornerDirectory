import { Search } from "lucide-react";
import Link from "next/link";
import { MainNav, type MenuGroup, MobileMenu } from "@/components/menus";
import { getCities, getGroups } from "@/lib/data";
import { cn } from "@/lib/utils";

// Corner-bracket mark: the city block's corner, with a peach spot where the good place is.
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 justify-self-start">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[0.9rem]", onDark ? "bg-butter text-primary" : "bg-primary text-primary-foreground")}>
        <svg aria-hidden viewBox="0 0 24 24" fill="none" className="size-6">
          <path d="M5 16V8.5A3.5 3.5 0 0 1 8.5 5H16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <rect x="12.5" y="12.5" width="6.5" height="6.5" rx="2.2" className="fill-peach" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-extrabold tracking-tight">CityCorner</span>
        <span className={cn("block text-[0.65rem] font-bold tracking-[0.3em] uppercase", onDark ? "text-primary-foreground/75" : "text-muted-foreground")}>Directory</span>
      </span>
    </Link>
  );
}

const links = [
  { href: "/cities", label: "Cities" },
  { href: "/for-businesses", label: "For business" },
  { href: "/write-a-review", label: "Write a review" },
];

// Logo left, nav centred, search and "Add a business" right, on the cream page itself.
export async function SiteHeader() {
  const [allGroups, allCities] = await Promise.all([getGroups(), getCities()]);
  const groups: MenuGroup[] = allGroups.map((g) => ({
    name: g.name,
    slug: g.slug,
    icon: g.icon,
    categories: g.categories.filter((c) => c.total > 0).map(({ slug, name }) => ({ slug, name })),
  }));
  const cities = [...allCities.slice(0, 8).map((c) => ({ href: `/${c.slug}`, label: c.name })), { href: "/cities", label: "All cities" }];

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <MobileMenu
          links={[{ href: "/search", label: "Search" }, { href: "/categories", label: "All categories" }, ...links, { href: "/add-a-business", label: "Add a business" }]}
          cities={cities}
          groups={groups}
        />
        <Logo />
        <MainNav links={links} groups={groups} />
        <div className="ml-auto flex items-center gap-2 lg:justify-self-end">
          <Link href="/search" aria-label="Search" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-butter hover:bg-peach">
            <Search className="size-[1.1rem]" />
          </Link>
          <Link href="/add-a-business" className="hidden rounded-full bg-primary px-5 py-2.5 font-bold whitespace-nowrap text-primary-foreground hover:bg-primary-dark sm:block">
            Add a business
          </Link>
        </div>
      </div>
    </header>
  );
}
