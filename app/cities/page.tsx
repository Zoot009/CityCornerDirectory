import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CityCard, Kicker, PageHeader, Section } from "@/components/cards";
import { toneAt } from "@/components/thumb";
import { getCities, getCoverPhotos } from "@/lib/data";
import { formatCount } from "@/lib/format";
import { pageMeta } from "@/lib/site";
import { pill } from "@/lib/utils";

export const metadata = pageMeta({
  title: "Every city",
  description: "Pick a city to see its top-rated cafés, dentists, plumbers, salons and more, ranked by real reviews.",
  path: "/cities",
});

export default async function CitiesPage() {
  const [cities, covers] = await Promise.all([getCities(), getCoverPhotos()]);
  const byCountry = [...Map.groupBy(cities, (c) => c.country)].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Breadcrumbs items={[{ name: "Every city", href: "/cities" }]} />
      <PageHeader
        tone="bg-matcha"
        photo={cities[0] && covers.cities.get(cities[0].id)}
        stats={[
          { value: formatCount(cities.length), label: cities.length === 1 ? "city" : "cities" },
          { value: formatCount(byCountry.length), label: byCountry.length === 1 ? "country" : "countries" },
          { value: formatCount(cities.reduce((n, c) => n + c.listed, 0)), label: "places listed" },
        ]}
      >
        <Kicker>City by city</Kicker>
        <h1 className="mt-4 text-5xl leading-[0.95] sm:text-7xl">Where to?</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Pick a city and wander its corners: the top-rated places in every category and neighbourhood.</p>
      </PageHeader>

      {cities.length > 0 && (
        <Section title="The busiest corners" kicker="Most places listed" id="popular" className="mt-20">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cities.slice(0, 9).map((c, i) => (
              <li key={c.slug} className={i === 0 ? "col-span-2 lg:row-span-2" : undefined}>
                <CityCard city={c} tone={toneAt(i)} big={i === 0} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {byCountry.length > 0 && (
        <Section title="A to Z, by country" kicker="Every city" id="all" className="mt-20">
          <div className="grid gap-3 md:grid-cols-2">
            {byCountry.map(([country, list]) => (
              <section key={country} aria-label={country} className="rounded-[2rem] bg-card p-6">
                <h3 className="text-2xl">{country}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {list
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <li key={c.slug}>
                        <Link href={`/${c.slug}`} className={pill()}>
                          {c.state && c.state !== country && c.state !== c.name ? `${c.name}, ${c.state}` : c.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
