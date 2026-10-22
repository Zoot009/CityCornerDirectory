import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryTile, ClaimBanner, FeatureCard, Kicker, PageHeader, PlaceCard, QuoteTile, Section } from "@/components/cards";
import { SearchForm } from "@/components/search-form";
import { toneAt } from "@/components/thumb";
import { getAreaListings, getCities, getCity, getCityListings, getCoverPhotos, getTopBusinesses, listingPath } from "@/lib/data";
import { formatCount, joinList, plural } from "@/lib/format";
import { pageMeta } from "@/lib/site";
import { cn } from "@/lib/utils";

// Every city is prerendered at build; a city added later renders on its first visit.
export const generateStaticParams = async () => (await getCities()).map((c) => ({ city: c.slug }));

async function load(params: PageProps<"/[city]">["params"]) {
  const city = (await getCity((await params).city)) ?? notFound();
  return { city, listings: await getCityListings(city) };
}

export async function generateMetadata({ params }: PageProps<"/[city]">) {
  const { city, listings } = await load(params);
  return pageMeta({
    title: `Things to do and places to go in ${city.label}`,
    description: `Explore ${formatCount(city.listed)} top-rated places in ${city.name}: ${joinList(
      listings.slice(0, 4).map((l) => l.category.lower),
    )} and more, ranked by real ratings with hours, phone numbers and maps.`,
    path: `/${city.slug}`,
  });
}

export default async function CityPage({ params }: PageProps<"/[city]">) {
  const { city, listings } = await load(params);
  const [areaListings, top, withQuotes, covers] = await Promise.all([
    getAreaListings(city),
    getTopBusinesses({ city, limit: 9 }),
    getTopBusinesses({ city, limit: 14, withQuote: true }),
    getCoverPhotos(),
  ]);
  const quoted = withQuotes.filter((b) => !top.some((t) => t.id === b.id)).slice(0, 5);
  const areas = [...Map.groupBy(areaListings, (l) => l.area.slug).values()].sort(
    (a, b) => b.reduce((n, l) => n + l.count, 0) - a.reduce((n, l) => n + l.count, 0),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Breadcrumbs items={[{ name: city.name, href: `/${city.slug}` }]} />
      <PageHeader
        photo={covers.cities.get(city.id)}
        stats={[
          { value: formatCount(city.listed), label: city.listed === 1 ? "place listed" : "places listed" },
          { value: formatCount(listings.length), label: listings.length === 1 ? "category" : "categories" },
          ...(areas.length > 0 ? [{ value: formatCount(areas.length), label: areas.length === 1 ? "neighbourhood" : "neighbourhoods" }] : []),
        ]}
      >
        <Kicker>{city.country}</Kicker>
        <h1 className="mt-4 text-5xl leading-[0.95] text-balance sm:text-7xl">Discover {city.name}</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          The best-loved places in {city.name}, corner by corner, ranked by real ratings and how many people left one.
        </p>
        <div className="mt-8">
          <SearchForm loc={city.name} />
        </div>
      </PageHeader>

      <div className="space-y-24 pt-20">
        <Section title={`Every corner of ${city.name}`} kicker="Categories" id="categories">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {listings.map((l, i) => (
              <li key={l.category.slug} className={i === 0 ? "col-span-2 row-span-2" : undefined}>
                <CategoryTile category={l.category} count={l.count} href={listingPath(l)} tone={toneAt(i)} feature={i === 0} />
              </li>
            ))}
          </ul>
        </Section>

        {top.length > 0 && (
          <Section title={`Top picks in ${city.name}`} kicker="Highest rated" id="top">
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <li className="sm:col-span-2 lg:row-span-2">
                <FeatureCard business={top[0]} rank={1} />
              </li>
              {top.slice(1).map((b, i) => (
                <li key={b.id}>
                  <PlaceCard business={b} rank={i + 2} tone={i < 4 ? toneAt(i + 1) : undefined} />
                </li>
              ))}
            </ol>
          </Section>
        )}

        {areas.length > 0 && (
          <Section title="Neighbourhood by neighbourhood" kicker="Go local" id="areas">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((ls, i) => (
                <li key={ls[0].area.slug} className={cn("rounded-[1.75rem] p-6", toneAt(i + 1))}>
                  <h3 className="text-2xl">{ls[0].area.name}</h3>
                  <p className="text-sm font-semibold text-muted-foreground">{plural(ls.reduce((n, l) => n + l.count, 0), "place", "places")}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {ls.map((l) => (
                      <li key={l.category.slug}>
                        <Link href={listingPath(l)} className="block rounded-full bg-card/75 px-3 py-1 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
                          {l.category.name} · {l.count}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {quoted.length > 0 && (
          <Section title={`What people say about ${city.name}`} kicker="Overheard" id="quotes">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quoted.map((b, i) => (
                <li key={b.id} className={i === 0 ? "sm:col-span-2" : undefined}>
                  <QuoteTile business={b} tone={toneAt(i)} big={i === 0} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <ClaimBanner />
      </div>
    </div>
  );
}
