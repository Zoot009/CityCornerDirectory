import { HeartHandshake, MapPinned, Search } from "lucide-react";
import Link from "next/link";
import { CategoryTile, CityCard, ClaimBanner, FeatureCard, Kicker, PhotoTile, PlaceCard, QuoteTile, Section, StatTile } from "@/components/cards";
import { CategoryIcon } from "@/components/category-icon";
import { SearchForm } from "@/components/search-form";
import { toneAt } from "@/components/thumb";
import { getCategories, getCities, getStats, getTopBusinesses } from "@/lib/data";
import { formatCount } from "@/lib/format";
import { pageMeta, SITE_NAME } from "@/lib/site";
import { categoryHref, cn, pill } from "@/lib/utils";

export const metadata = pageMeta({
  title: "Every corner of the city, ranked by the people who go there",
  description:
    "Find the best-loved cafés, dentists, salons, plumbers and more on every corner of your city. Ranked by real ratings and review counts, never by payment.",
  path: "/",
});

const steps = [
  { icon: Search, tone: "bg-matcha", title: "Pick a corner", text: "Search for what you need and where, or wander through a city's categories and neighbourhoods." },
  {
    icon: HeartHandshake,
    tone: "bg-cloud",
    title: "Compare honestly",
    text: "Places rank by rating and by how many people rated them, so two lucky 5-star reviews can't jump the queue.",
  },
  { icon: MapPinned, tone: "bg-peach", title: "Head out", text: "Call, open the website or get directions straight from the page. No middleman, no booking fees." },
];

export default async function HomePage() {
  const [stats, categories, cities, top, withQuotes] = await Promise.all([
    getStats(),
    getCategories(),
    getCities(),
    getTopBusinesses({ limit: 12 }),
    getTopBusinesses({ limit: 16, withQuote: true }),
  ]);
  const popular = categories.filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const picks = top.slice(0, 5);
  // Hero photo tiles come from just below the top five (so the bento doesn't repeat them), photos first.
  const pool = [...top.slice(5), ...picks];
  const heroPicks = [...pool.filter((b) => b.thumbnail), ...pool.filter((b) => !b.thumbnail)].slice(0, 2);
  const showPicks = heroPicks.length === 2;
  const quoted = withQuotes.filter((b) => !picks.some((t) => t.id === b.id)).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 pt-3">
      {/* The hero is itself a bento: headline + search, two photo tiles, live counts and what's popular. */}
      <section aria-labelledby="hero-h" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 flex flex-col justify-between gap-10 rounded-[2.25rem] bg-butter p-6 sm:p-10 lg:row-span-2">
          <Kicker>Free local guide · no paid spots</Kicker>
          <div>
            <h1 id="hero-h" className="text-5xl leading-[0.95] text-balance sm:text-7xl">
              Good places, around every corner.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              From the café on your street to the dentist across town, ranked by what real customers said. Nobody pays to be here.
            </p>
          </div>
          <SearchForm big />
        </div>
        {showPicks && (
          <>
            <PhotoTile business={heroPicks[0]} className="col-span-2 lg:col-span-1 lg:row-span-2" />
            <PhotoTile business={heroPicks[1]} />
          </>
        )}
        <StatTile value={formatCount(stats.businesses)} label="places on the map" tone="bg-primary text-primary-foreground" />
        <StatTile value={formatCount(cities.length)} label={cities.length === 1 ? "city covered" : "cities covered"} tone="bg-matcha" />
        <StatTile value={formatCount(stats.reviews)} label="customer reviews counted" tone="bg-cloud" />
        <div className={cn("rounded-[1.75rem] bg-peach p-5", showPicks && "col-span-2")}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-display text-xl font-extrabold tracking-tight">Popular now</p>
            <Link href="/categories" className="link text-sm">
              {formatCount(popular.length)} categories
            </Link>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {popular.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={categoryHref(c.name)} className="inline-flex items-center gap-1.5 rounded-full bg-card/75 px-3 py-1.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
                  <CategoryIcon name={c.icon} className="size-4" /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {popular.length > 0 && (
        <Section title="Pick a corner" kicker="Browse by category" id="categories" action={{ href: "/categories", label: "All categories" }}>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {popular.slice(0, 9).map((c, i) => (
              <li key={c.slug} className={i === 0 ? "col-span-2 lg:row-span-2" : undefined}>
                <CategoryTile category={c} count={c.total} href={categoryHref(c.name)} tone={toneAt(i)} feature={i === 0} />
              </li>
            ))}
          </ul>
          {popular.length > 9 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {popular.slice(9, 27).map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(c.name)} className={pill()}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className={pill(true)}>
                  Everything
                </Link>
              </li>
            </ul>
          )}
        </Section>
      )}

      {picks.length > 0 && (
        <Section title="The corners people love most" kicker="Top picks" id="top" action={{ href: "/search", label: "Browse everything" }}>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li className="sm:col-span-2 lg:row-span-2">
              <FeatureCard business={picks[0]} rank={1} />
            </li>
            {picks.slice(1).map((b, i) => (
              <li key={b.id}>
                <PlaceCard business={b} rank={i + 2} tone={toneAt(i + 1)} />
              </li>
            ))}
          </ol>
        </Section>
      )}

      {cities.length > 0 && (
        <Section title="Choose your city" kicker="City by city" id="cities" action={{ href: "/cities", label: `All ${formatCount(cities.length)} cities` }}>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cities.slice(0, 5).map((c, i) => (
              <li key={c.slug} className={i === 0 ? "col-span-2 lg:row-span-2" : undefined}>
                <CityCard city={c} tone={toneAt(i + 2)} big={i === 0} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {quoted.length > 0 && (
        <Section title="What regulars are saying" kicker="Overheard" id="quotes">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quoted.map((b, i) => (
              <li key={b.id} className={i === 0 ? "sm:col-span-2" : undefined}>
                <QuoteTile business={b} tone={toneAt(i)} big={i === 0} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`How ${SITE_NAME} works`} kicker="Three easy steps" id="how">
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className={cn("relative isolate flex min-h-64 flex-col justify-between gap-8 overflow-hidden rounded-[2rem] p-7", s.tone)}>
              <span aria-hidden className="absolute -top-8 right-2 -z-10 font-display text-[10rem] leading-none font-extrabold opacity-10">
                {i + 1}
              </span>
              <span className="flex size-14 items-center justify-center rounded-[1.1rem] bg-primary text-primary-foreground">
                <s.icon className="size-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-extrabold tracking-tight">{s.title}</p>
                <p className="mt-2 text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <ClaimBanner />
    </div>
  );
}
