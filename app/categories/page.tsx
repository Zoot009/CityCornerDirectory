import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Kicker, PageHeader } from "@/components/cards";
import { CategoryIcon } from "@/components/category-icon";
import { toneAt } from "@/components/thumb";
import { getCities, getCoverPhotos, getGroups } from "@/lib/data";
import { formatCount, plural } from "@/lib/format";
import { pageMeta } from "@/lib/site";
import { categoryHref, cn, pill } from "@/lib/utils";

export const metadata = pageMeta({
  title: "Every category",
  description: "Cafés, health, home services, beauty, shopping, pets and more: every kind of local place we list, in cities worldwide.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const [groups, cities, covers] = await Promise.all([getGroups(), getCities(), getCoverPhotos()]);
  const all = groups.flatMap((g) => g.categories);
  const biggest = [...all].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Breadcrumbs items={[{ name: "Every category", href: "/categories" }]} />
      <PageHeader
        tone="bg-peach"
        photo={biggest && covers.categories.get(biggest.id)}
        stats={[
          { value: formatCount(all.length), label: all.length === 1 ? "category" : "categories" },
          { value: formatCount(cities.length), label: cities.length === 1 ? "city" : "cities" },
        ]}
      >
        <Kicker>Browse by category</Kicker>
        <h1 className="mt-4 text-5xl leading-[0.95] text-balance sm:text-7xl">What are you after?</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {plural(groups.length, "group", "groups")} of local places, from a morning coffee to a midnight locksmith.
        </p>
      </PageHeader>

      <nav aria-label="Jump to a group" className="mt-6 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.slug} href={`#${g.slug}`} className={pill()}>
            <CategoryIcon name={g.icon} className="size-4" /> {g.name}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-3">
        {groups.map((g, i) => (
          <section key={g.slug} id={g.slug} aria-labelledby={`${g.slug}-h`} className="grid scroll-mt-24 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className={cn("flex flex-col justify-between gap-8 rounded-[2rem] p-6", toneAt(i))}>
              <span className="flex size-14 items-center justify-center rounded-[1.1rem] bg-primary text-primary-foreground">
                <CategoryIcon name={g.icon} className="size-7" />
              </span>
              <div>
                <h2 id={`${g.slug}-h`} className="text-3xl">
                  {g.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{plural(g.total, "place", "places")}</p>
              </div>
            </div>
            <ul className="grid content-start gap-2 rounded-[2rem] bg-card p-3 sm:grid-cols-2 xl:grid-cols-3">
              {g.categories.map((c) => (
                <li key={c.slug}>
                  {c.total ? (
                    <Link href={categoryHref(c.name)} className="group flex items-center justify-between gap-3 rounded-[1.1rem] bg-tint py-2 pr-2 pl-4 hover:bg-butter">
                      <span className="truncate font-bold">{c.name}</span>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", toneAt(i))}>{formatCount(c.total)}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center justify-between gap-3 rounded-[1.1rem] py-2 pr-2 pl-4 text-muted-foreground">
                      <span className="truncate">{c.name}</span>
                      <span className="shrink-0 px-2.5 py-1 text-xs">soon</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
