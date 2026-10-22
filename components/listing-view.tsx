import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FeatureCard, PageHeader, PlaceCard, Section } from "@/components/cards";
import { CategoryIcon } from "@/components/category-icon";
import { Faq, type FaqItem } from "@/components/faq";
import { areaView, GoogleMap } from "@/components/google-map";
import { JsonLd } from "@/components/json-ld";
import { toneFor } from "@/components/thumb";
import { type Business, businessPath, getAreaListings, getCityListings, getOtherCities, type Listing, listingPath, opensOnSunday } from "@/lib/data";
import { formatCount, joinList, plural } from "@/lib/format";
import { absoluteUrl, pageMeta, SITE_NAME } from "@/lib/site";
import { cn, pill } from "@/lib/utils";

const placeName = (l: Listing) => (l.area ? `${l.area.name}, ${l.city.name}` : l.city.name);

export function listingMeta(l: Listing) {
  const n = l.businesses.length;
  return pageMeta({
    title: `Top ${n} ${l.category.lower} in ${placeName(l)}`,
    description: `${n} top-rated ${l.category.lower} in ${placeName(l)}, ordered by rating and review count. Includes ${joinList(
      l.businesses.slice(0, 3).map((b) => b.name),
    )}, with opening hours, phone numbers and maps.`,
    path: listingPath(l),
  });
}

// "Top X in City" and "Top X in Area, City" share this layout: a bento header, then the ranked bento.
export async function ListingView({ listing: l }: { listing: Listing }) {
  const { city, category, area, businesses } = l;
  const place = placeName(l);
  const heading = `Top ${category.lower} in ${place}`;
  const parentPath = listingPath({ city, category });

  const [cityListings, areas, otherCities, cityAreas] = await Promise.all([
    getCityListings(city),
    getAreaListings(city, category),
    getOtherCities(category, city),
    area ? getAreaListings(city) : Promise.resolve([]),
  ]);
  const parentCount = cityListings.find((x) => x.category.id === category.id)?.count ?? businesses.length;
  const related = cityListings
    .filter((x) => x.category.id !== category.id)
    .sort((a, b) => Number(b.category.group === category.group) - Number(a.category.group === category.group))
    .slice(0, 10);
  const sameArea = cityAreas.filter((x) => x.area.slug === area?.slug && x.category.id !== category.id);
  const mapArea = areaView(businesses.flatMap((b) => (b.geo ? [b.geo] : [])));
  const tone = toneFor(category.name);
  const [first, ...rest] = businesses;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Breadcrumbs
        items={[
          { name: city.name, href: `/${city.slug}` },
          { name: category.name, href: parentPath },
          ...(area ? [{ name: area.name, href: listingPath(l) }] : []),
        ]}
      />

      <PageHeader
        tone={tone}
        photo={businesses.find((b) => b.thumbnail)?.thumbnail}
        stats={[
          { value: formatCount(businesses.length), label: "places, ranked" },
          { value: formatCount(businesses.reduce((n, b) => n + b.reviewCount, 0)), label: "reviews behind the order" },
          ...(areas.length > 0 ? [{ value: formatCount(areas.length), label: "neighbourhood lists" }] : []),
        ]}
      >
        <span className="flex size-14 items-center justify-center rounded-[1.1rem] bg-primary text-primary-foreground">
          <CategoryIcon name={category.icon} className="size-7" />
        </span>
        <h1 className="mt-6 text-4xl text-balance sm:text-6xl">{heading}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Sorted by rating and by how many people left one, so nobody can pay their way up.{" "}
          <Link href="/about#rankings" className="link">
            How we rank
          </Link>
        </p>
      </PageHeader>

      {areas.length > 0 && (
        <nav aria-label="Neighbourhoods" className="-mx-4 mt-6 overflow-x-auto px-4 pb-2">
          <ul className="flex gap-2 whitespace-nowrap">
            <li>
              <Link href={parentPath} aria-current={!area ? "page" : undefined} className={pill(!area)}>
                Everywhere · {parentCount}
              </Link>
            </li>
            {areas.map((a) => (
              <li key={a.area.slug}>
                <Link href={listingPath(a)} aria-current={a.area.slug === area?.slug ? "page" : undefined} className={pill(a.area.slug === area?.slug)}>
                  {a.area.name} · {a.count}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {mapArea && <GoogleMap area={mapArea} title={`Map of ${place}`} className="mt-4 h-64 rounded-[2rem] sm:h-80" />}

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li className="sm:col-span-2 lg:row-span-2">
          <FeatureCard business={first} rank={1} />
        </li>
        {rest.map((b, i) => (
          <li key={b.id}>
            <PlaceCard business={b} rank={i + 2} />
          </li>
        ))}
      </ol>

      <div className="mt-20 grid items-start gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] bg-tint p-5 sm:p-8">
          <Section title="Good to know" kicker={`${category.name} in ${place}`} id="faq">
            <Faq items={listingFaqs(l)} />
          </Section>
        </div>
        <div className="grid gap-3">
          {sameArea.length > 0 && (
            <Chips title={`Also in ${area!.name}`} tone="bg-matcha" links={sameArea.map((x) => ({ href: listingPath(x), label: `${x.category.name} · ${x.count}` }))} />
          )}
          {related.length > 0 && <Chips title={`More in ${city.name}`} tone="bg-cloud" links={related.map((x) => ({ href: listingPath(x), label: x.category.name }))} />}
          {otherCities.length > 0 && (
            <Chips title={`${category.name} elsewhere`} tone="bg-peach" links={otherCities.map((x) => ({ href: listingPath(x), label: x.city.name }))} />
          )}
        </div>
      </div>

      <JsonLd
        data={{
          "@type": "ItemList",
          name: heading,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, url: absoluteUrl(businessPath(b)) })),
        }}
      />
    </div>
  );
}

function Chips({ title, tone, links }: { title: string; tone: string; links: { href: string; label: string }[] }) {
  return (
    <section className={cn("rounded-[2rem] p-6", tone)}>
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex rounded-full bg-card/75 px-3.5 py-1.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Answers written from the list itself, so each page's FAQ is its own.
function listingFaqs(l: Listing): FaqItem[] {
  const cat = l.category.lower;
  const place = placeName(l);
  const list = l.businesses;
  const rated = (b: Business) =>
    b.rating === null ? b.name : `${b.name} (${b.rating.toFixed(1)}★, ${plural(b.reviewCount, "review", "reviews")})`;
  const top = list.filter((b) => b.rating !== null).slice(0, 3);
  const areas = [...new Set(list.flatMap((b) => (b.area ? [b.area.name] : [])))];
  const withHours = list.filter((b) => b.hours.length);
  const sunday = withHours.filter(opensOnSunday);
  const sundayHours = (b: Business) => b.hours.find(([d]) => d === "sunday")![1];
  const mostReviewed = [...list].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 3).filter((b) => b.reviewCount);
  const online = list.filter((b) => b.serviceOptions.online_appointments);

  const faqs: (FaqItem | false)[] = [
    top.length > 0 && {
      q: `Which ${cat} in ${place} are rated highest?`,
      a: `Weighing each rating by its number of reviews, the top spots go to ${joinList(top.map(rated))}.`,
    },
    {
      q: `How many ${cat} does ${SITE_NAME} list in ${place}?`,
      a: `There are ${plural(list.length, l.category.singularLower, cat)} on this page${
        !l.area && areas.length > 1 ? `, spread over ${areas.length} neighbourhoods such as ${joinList(areas.slice(0, 3))}` : ""
      }.`,
    },
    withHours.length > 0 && {
      q: `Can I find ${cat} in ${place} open on a Sunday?`,
      a: sunday.length
        ? `Yes: ${sunday.length} of the ${withHours.length} with listed hours open on Sundays, for example ${joinList(
            sunday.slice(0, 3).map((b) => `${b.name} (${sundayHours(b)})`),
          )}. Hours can change, so a quick call first is a good idea.`
        : `None of the ${withHours.length} places with listed hours open on Sundays. Hours do change, so it's worth calling.`,
    },
    mostReviewed.length > 0 && {
      q: `Which ${cat} in ${place} have the most reviews?`,
      a: `${joinList(mostReviewed.map((b) => `${b.name} (${plural(b.reviewCount, "review", "reviews")})`))}.`,
    },
    online.length > 0 && {
      q: `Can I book ${cat} in ${place} online?`,
      a: `Yes, ${plural(online.length, `${l.category.singularLower} takes`, `${cat} take`)} online bookings, including ${joinList(online.slice(0, 3).map((b) => b.name))}.`,
    },
  ];
  return faqs.filter((f): f is FaqItem => !!f);
}
