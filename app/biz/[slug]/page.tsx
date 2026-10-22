import { Check, ExternalLink, Globe, MapPin, Navigation, PencilLine, Phone, Star, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PlaceCard, Section, telHref } from "@/components/cards";
import { GoogleMap } from "@/components/google-map";
import { HoursTable } from "@/components/hours-table";
import { JsonLd } from "@/components/json-ld";
import { OpenStatus } from "@/components/open-status";
import { RatingPill, Stars } from "@/components/rating";
import { ShareButton } from "@/components/share-button";
import { Thumb, toneAt } from "@/components/thumb";
import { type Business, businessPath, getAreaListings, getBusiness, getNearby, listingPath } from "@/lib/data";
import { humanise, plural } from "@/lib/format";
import { absoluteUrl, pageMeta } from "@/lib/site";
import { cn, pill } from "@/lib/utils";

// ~205,000 places: none at build, each rendered on its first visit and cached (see app/layout.tsx).
export const generateStaticParams = () => [];

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

async function load(params: PageProps<"/biz/[slug]">["params"]) {
  return (await getBusiness(decode((await params).slug))) ?? notFound();
}

const placeOf = (b: Business) => (b.area ? `${b.area.name}, ${b.city.name}` : b.city.name);

export async function generateMetadata({ params }: PageProps<"/biz/[slug]">) {
  const { business: b, categories } = await load(params);
  const kind = b.type ?? categories[0].singular;
  const rating = b.rating !== null && b.reviewCount ? ` Rated ${b.rating.toFixed(1)} by ${plural(b.reviewCount, "customer", "customers")}.` : "";
  return pageMeta({
    title: `${b.name}, ${placeOf(b)}`,
    description: `${kind} in ${placeOf(b)}.${rating} Opening hours, phone number, map and directions for ${b.name}.`,
    path: businessPath(b),
  });
}

const directionsUrl = (b: Business) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${b.name}, ${b.address}`)}`;
const action = "flex items-center gap-3 rounded-[1.1rem] bg-primary-foreground/10 px-4 py-3 text-sm font-bold hover:bg-butter hover:text-foreground";
const smallButton = "flex items-center justify-center gap-2 rounded-full bg-card/75 py-2.5 text-sm font-bold hover:bg-card";

export default async function BusinessPage({ params }: PageProps<"/biz/[slug]">) {
  const { business: b, categories } = await load(params);
  const category = categories[0];
  const [more, areaListings] = await Promise.all([getNearby(b, category, 3), getAreaListings(b.city, category)]);
  const areaListing = b.area && areaListings.find((l) => l.area.slug === b.area!.slug);
  const moreIn = b.area && more.filter((x) => x.area?.slug === b.area!.slug).length >= 2 ? b.area.name : b.city.name;

  const amenities = [
    ...(Object.keys(b.serviceOptions).length
      ? [{ group: "Service options", items: Object.entries(b.serviceOptions).map(([k, v]) => ({ label: humanise(k), available: v })) }]
      : []),
    ...[...Map.groupBy(b.extensions, (e) => e.group)].map(([group, es]) => ({
      group: humanise(group),
      items: [...new Set(es.flatMap((e) => e.items))].map((label) => ({ label, available: true })),
    })),
  ];
  const site = b.website ? new URL(b.website).hostname.replace(/^www\./, "") : null;
  const hasAbout = !!(b.description || b.quote || b.types.length > 0);
  const sections = [
    hasAbout && { id: "about", label: "About" },
    { id: "ratings", label: "Ratings" },
    { id: "visit", label: "Map" },
    { id: "hours", label: "Hours" },
    amenities.length > 0 && { id: "amenities", label: "Good to know" },
  ].filter((s): s is { id: string; label: string } => !!s);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Breadcrumbs
        items={[
          { name: b.city.name, href: `/${b.city.slug}` },
          { name: category.name, href: listingPath({ city: b.city, category }) },
          ...(areaListing ? [{ name: areaListing.area.name, href: listingPath(areaListing) }] : []),
          { name: b.name, href: businessPath(b) },
        ]}
      />

      {/* Profile bento: photo, who and how good, every way to reach them, and what you can do here. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative min-h-72 overflow-hidden rounded-[2rem] sm:col-span-2 lg:row-span-2">
          <Thumb name={b.name} src={b.thumbnail} className="absolute inset-0 size-full text-8xl" />
          {b.price && <span className="absolute top-4 left-4 rounded-full bg-card px-3 py-1 text-sm font-extrabold">{b.price}</span>}
        </div>

        <div className="flex flex-col justify-end rounded-[2rem] bg-cloud p-6 sm:col-span-2 sm:p-8">
          <p className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={listingPath({ city: b.city, category: c })}
                className="rounded-full bg-card/75 px-3 py-1 text-xs font-bold hover:bg-primary hover:text-primary-foreground"
              >
                {c.singular}
              </Link>
            ))}
          </p>
          <h1 className="mt-4 text-4xl leading-[1.02] text-balance sm:text-5xl">{b.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <RatingPill rating={b.rating} count={b.reviewCount} />
            <OpenStatus hours={b.hours} className="text-sm" />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> {placeOf(b)}
          </p>
        </div>

        <div className="rounded-[2rem] bg-primary p-5 text-primary-foreground">
          <h2 className="text-xl">Get in touch</h2>
          <div className="mt-3 grid gap-2">
            {b.phone && (
              <a href={telHref(b.phone)} className={action}>
                <Phone className="size-4 shrink-0" /> {b.phone}
              </a>
            )}
            {b.website && site && (
              // A normal, followed link on purpose: linking to the business is the point of a listing.
              <a href={b.website} target="_blank" rel="noopener" className={action}>
                <Globe className="size-4 shrink-0" /> <span className="truncate">{site}</span> <ExternalLink className="ml-auto size-3.5 shrink-0" />
              </a>
            )}
            <a href={directionsUrl(b)} target="_blank" rel="noopener" className={action}>
              <Navigation className="size-4 shrink-0" /> Get directions
            </a>
          </div>
        </div>

        <div className="flex flex-col rounded-[2rem] bg-peach p-5">
          <h2 className="text-xl">Been here?</h2>
          <Link
            href={`/write-a-review?biz=${encodeURIComponent(b.slug)}`}
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground hover:bg-primary-dark"
          >
            <Star className="size-4" /> Write a review
          </Link>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ShareButton title={b.name} className={smallButton} />
            <Link href={`/suggest-an-edit?biz=${encodeURIComponent(b.slug)}`} className={smallButton}>
              <PencilLine className="size-4" /> Fix info
            </Link>
          </div>
          <p className="mt-auto pt-4 text-sm">
            Is this your place?{" "}
            <Link href={`/claim?biz=${encodeURIComponent(b.slug)}`} className="link">
              Claim this page
            </Link>
          </p>
        </div>
      </div>

      <nav aria-label="On this page" className="sticky top-18 z-10 -mx-4 mt-3 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur-md">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={pill()}>
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {hasAbout && (
          <Tile id="about" title={`About ${b.name}`} className="bg-card lg:col-span-2">
            {b.description && <p className="leading-relaxed">{b.description}</p>}
            {b.quote && <p className="mt-4 rounded-[1.5rem] rounded-bl-sm bg-peach p-5 font-display text-lg font-bold tracking-tight">&ldquo;{b.quote}&rdquo;</p>}
            {b.types.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="What they do">
                {b.types.map((t) => (
                  <li key={t} className="rounded-full bg-tint px-3 py-1 text-sm font-semibold">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </Tile>
        )}

        <Tile id="ratings" title="Ratings" className={cn("bg-butter", !hasAbout && "lg:col-span-3")}>
          <p className="font-display text-7xl leading-none font-extrabold tracking-tight">{b.rating !== null ? b.rating.toFixed(1) : "–"}</p>
          {b.rating !== null && (
            <div className="mt-2">
              <Stars value={b.rating} />
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {b.reviewCount ? `${plural(b.reviewCount, "customer has", "customers have")} rated ${b.name}.` : `Nobody has rated ${b.name} yet.`} Our
            ranking weighs the rating by how many people gave one.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/write-a-review?biz=${encodeURIComponent(b.slug)}`}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
            >
              Add your review
            </Link>
            {b.mapsUrl && b.reviewCount > 0 && (
              <a href={b.mapsUrl} target="_blank" rel="nofollow noopener" className="inline-flex items-center gap-1.5 rounded-full bg-card/75 px-5 py-2.5 text-sm font-bold hover:bg-card">
                Reviews on Google <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </Tile>

        <Tile id="visit" title="Find it" className="bg-card lg:col-span-2">
          <GoogleMap place={`${b.name}, ${b.address}`} title={`Map showing ${b.name}`} className="h-64 rounded-[1.5rem] sm:h-72" />
          <p className="mt-4 flex gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {b.address}
          </p>
        </Tile>

        <Tile id="hours" title="Opening hours" className="bg-matcha">
          {b.hours.length > 0 ? (
            <HoursTable hours={b.hours} />
          ) : (
            <p className="rounded-[1.25rem] bg-card/60 p-5 text-sm">
              No opening hours yet.{" "}
              <Link href={`/suggest-an-edit?biz=${encodeURIComponent(b.slug)}`} className="link">
                Know them? Add them
              </Link>
            </p>
          )}
        </Tile>

        {amenities.length > 0 && (
          <Tile id="amenities" title="Good to know" className="bg-cloud lg:col-span-3">
            <div className="grid gap-5 md:grid-cols-2">
              {amenities.map((g) => (
                <div key={g.group}>
                  <h3 className="text-lg">{g.group}</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {g.items.map((item) => (
                      <li
                        key={item.label}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                          item.available ? "bg-card/75" : "bg-primary/5 text-muted-foreground line-through",
                        )}
                      >
                        {item.available ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                        {!item.available && <span className="sr-only">No </span>}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Tile>
        )}
      </div>

      {more.length > 0 && (
        <Section title={`More ${category.lower} in ${moreIn}`} kicker="Around the corner" id="more" className="mt-24">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((x, i) => (
              <li key={x.id}>
                <PlaceCard business={x} tone={toneAt(i + 1)} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <JsonLd
        data={{
          "@type": category.schemaType,
          "@id": `${absoluteUrl(businessPath(b))}#place`,
          name: b.name,
          url: absoluteUrl(businessPath(b)),
          ...(b.website && { sameAs: [b.website] }),
          ...(b.description && { description: b.description }),
          ...(b.phone && { telephone: b.phone }),
          ...(b.thumbnail && { image: b.thumbnail }),
          ...(b.price && { priceRange: b.price }),
          address: {
            "@type": "PostalAddress",
            streetAddress: b.address,
            addressLocality: b.city.name,
            ...(b.city.state && b.city.state !== b.city.country && { addressRegion: b.city.state }),
            addressCountry: b.city.countryCode.toUpperCase(),
          },
          ...(b.geo && { geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng } }),
        }}
      />
    </div>
  );
}

function Tile({ id, title, className, children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn("scroll-mt-36 rounded-[2rem] p-6 sm:p-8", className)}>
      <h2 id={`${id}-h`} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
