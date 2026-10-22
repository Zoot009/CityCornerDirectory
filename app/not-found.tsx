import Link from "next/link";
import { Arrow, Kicker } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { getCities } from "@/lib/data";
import { cn } from "@/lib/utils";

const ways = [
  { href: "/", label: "Back home", tone: "bg-primary text-primary-foreground", onDark: true },
  { href: "/categories", label: "Every category", tone: "bg-matcha", onDark: false },
  { href: "/cities", label: "Every city", tone: "bg-cloud", onDark: false },
];

// A small bento: the search on a butter tile, three ways back, and the busiest cities on peach.
export default async function NotFound() {
  const cities = (await getCities()).slice(0, 8);
  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-4 pt-8 lg:grid-cols-3">
      <section className="relative isolate overflow-hidden rounded-[2.25rem] bg-butter p-6 sm:p-10 lg:col-span-2 lg:row-span-3">
        <span aria-hidden className="absolute -right-3 -bottom-14 -z-10 font-display text-[11rem] leading-none font-extrabold opacity-10 sm:text-[15rem]">
          404
        </span>
        <Kicker>Page not found</Kicker>
        <h1 className="mt-4 text-5xl leading-[0.95] text-balance sm:text-7xl">This corner is empty</h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          The page may have moved, or the place isn&apos;t listed any more. Try a search, or take another way in.
        </p>
        <div className="mt-8">
          <SearchForm big />
        </div>
      </section>
      {ways.map((w) => (
        <Link
          key={w.href}
          href={w.href}
          className={cn("group flex min-h-28 items-end justify-between gap-3 rounded-[1.75rem] p-6 font-display text-2xl font-extrabold tracking-tight", w.tone)}
        >
          {w.label} <Arrow onDark={w.onDark} />
        </Link>
      ))}
      {cities.length > 0 && (
        <section className="rounded-[1.75rem] bg-peach p-6 lg:col-span-3">
          <p className="font-display text-xl font-extrabold tracking-tight">Or start in a city</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="inline-flex rounded-full bg-card/75 px-4 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
