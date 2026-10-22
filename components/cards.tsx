import { ArrowUpRight, Globe, MapPin, Phone, Quote, Store } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { OpenStatus } from "@/components/open-status";
import { RatingPill, Stars } from "@/components/rating";
import { Thumb, tones } from "@/components/thumb";
import { type Business, businessPath, type Category, type City, getCoverPhotos, SEARCH_FEATURES } from "@/lib/data";
import { plural } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// The little arrow-in-a-circle on every tile; turns to point right on hover.
export function Arrow({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:rotate-45",
        onDark ? "bg-primary-foreground/20 text-primary-foreground backdrop-blur" : "bg-card/75 text-foreground",
        className,
      )}
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

// Small corner bracket (the logo's shape) before a kicker line.
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase", className)}>
      <span aria-hidden className="size-2.5 rounded-tl-[3px] border-t-[3px] border-l-[3px] border-current" />
      {children}
    </p>
  );
}

export function Section({
  title,
  kicker,
  id,
  action,
  children,
  className,
}: {
  title: string;
  kicker?: string;
  id?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h2 id={id} className="mt-2 text-3xl text-balance sm:text-5xl">
            {title}
          </h2>
        </div>
        {action && (
          <Link href={action.href} className="group inline-flex items-center gap-2.5 font-bold">
            <span className="underline decoration-primary/35 decoration-2 underline-offset-[5px] group-hover:decoration-primary">{action.label}</span>
            <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-45">
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        )}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

// A number and what it counts, as a colour block. Every figure passed in comes from the data.
export function StatTile({ value, label, tone, className }: { value: string; label: string; tone: string; className?: string }) {
  return (
    <div className={cn("flex min-h-32 flex-col justify-end rounded-[1.75rem] p-5", tone, className)}>
      <p className="font-display text-4xl font-extrabold tracking-tight xl:text-5xl">{value}</p>
      <p className="mt-1 text-sm font-semibold opacity-80">{label}</p>
    </div>
  );
}

// Bento page header: a title tile, an optional photo tile and a column of stat tiles.
export function PageHeader({
  tone = "bg-butter",
  photo,
  stats = [],
  children,
}: {
  tone?: string;
  photo?: string | null;
  stats?: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  const statTones = ["bg-primary text-primary-foreground", ...tones.filter((t) => t !== tone)];
  return (
    <section
      className={cn(
        "mt-6 grid gap-3",
        photo && stats.length > 0 && "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,0.85fr)]",
        photo && !stats.length && "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]",
        !photo && stats.length > 0 && "lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]",
      )}
    >
      <div className={cn("flex min-w-0 flex-col justify-end rounded-[2rem] p-6 sm:p-10", tone)}>{children}</div>
      {photo && (
        <div className="relative min-h-56 overflow-hidden rounded-[2rem] bg-tint">
          <Thumb name="" src={photo} className="absolute inset-0 size-full" />
        </div>
      )}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {stats.map((s, i) => (
            <StatTile key={s.label} {...s} tone={statTones[i]} className={cn(stats.length % 2 === 1 && i === 0 && "col-span-2 lg:col-span-1")} />
          ))}
        </div>
      )}
    </section>
  );
}

const highlights = (b: Business) =>
  Object.entries(SEARCH_FEATURES)
    .filter(([key, f]) => key !== "website" && f.test(b))
    .map(([, f]) => f.label);

// The everyday card: photo (or a pastel initials tile), rank, rating, a line from a review and a call button.
export function PlaceCard({ business: b, rank, tone = "bg-card" }: { business: Business; rank?: number; tone?: string }) {
  return (
    <article className={cn("group relative flex h-full flex-col rounded-[1.75rem] p-2.5 transition-transform hover:-translate-y-0.5", tone)}>
      <div className="relative">
        <Thumb name={b.name} src={b.thumbnail} className="aspect-[4/3] w-full rounded-[1.35rem] text-4xl" />
        {rank !== undefined && (
          <span className="absolute top-2.5 left-2.5 flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-2.5 font-display font-extrabold text-primary-foreground">
            <span className="sr-only">Rank </span>
            {rank}
          </span>
        )}
        {b.price && <span className="absolute top-2.5 right-2.5 rounded-full bg-card px-2.5 py-1 text-xs font-extrabold">{b.price}</span>}
      </div>
      <div className="flex flex-1 flex-col px-2 pt-3.5 pb-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-tight">
            <Link href={businessPath(b)} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
              {b.name}
            </Link>
          </h3>
          <Arrow className="bg-primary/5" />
        </div>
        <RatingPill rating={b.rating} count={b.reviewCount} className="mt-2" />
        <p className="mt-2 truncate text-sm text-muted-foreground">{[b.type, b.area?.name ?? b.city.name].filter(Boolean).join(" · ")}</p>
        <OpenStatus hours={b.hours} className="mt-1 text-sm" />
        {b.quote && <p className="mt-3 line-clamp-2 rounded-[1.1rem] rounded-bl-sm bg-primary/5 px-3.5 py-2.5 text-sm">&ldquo;{b.quote}&rdquo;</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3.5">
          {highlights(b)
            .slice(0, 2)
            .map((h) => (
              <span key={h} className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold">
                {h}
              </span>
            ))}
          {b.phone && (
            <a
              href={telHref(b.phone)}
              className="relative z-10 ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
            >
              <Phone className="size-3.5" /> Call
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// The big mocha tile that leads a ranked bento.
export function FeatureCard({ business: b, rank }: { business: Business; rank?: number }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
      <div className="relative min-h-64 flex-1 lg:min-h-72">
        <Thumb name={b.name} src={b.thumbnail} className="absolute inset-0 size-full text-8xl transition duration-500 group-hover:scale-[1.03]" />
        {rank !== undefined && (
          <span className="absolute top-4 left-4 rounded-full bg-butter px-4 py-1.5 font-display text-lg font-extrabold text-foreground">
            <span className="sr-only">Rank </span>№ {rank}
          </span>
        )}
        <Arrow onDark className="absolute top-4 right-4 size-11" />
      </div>
      <div className="p-6 sm:p-7">
        <h3 className="text-3xl leading-tight sm:text-4xl">
          <Link href={businessPath(b)} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
            {b.name}
          </Link>
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <RatingPill rating={b.rating} count={b.reviewCount} onDark />
          <OpenStatus hours={b.hours} onDark className="text-sm" />
        </div>
        <p className="mt-2 text-sm text-primary-foreground/75">{[b.type, b.area?.name ? `${b.area.name}, ${b.city.name}` : b.city.name].filter(Boolean).join(" · ")}</p>
        {b.quote && <p className="mt-5 line-clamp-3 rounded-[1.25rem] rounded-bl-sm bg-primary-foreground/10 p-4 leading-relaxed">&ldquo;{b.quote}&rdquo;</p>}
        {b.phone && (
          <a href={telHref(b.phone)} className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-butter px-5 py-2.5 font-bold text-foreground hover:bg-peach">
            <Phone className="size-4" /> Call {b.phone}
          </a>
        )}
      </div>
    </article>
  );
}

// Photo tile with the name and rating laid over it (home hero).
export function PhotoTile({ business: b, className }: { business: Business; className?: string }) {
  return (
    <Link href={businessPath(b)} className={cn("group relative isolate flex min-h-52 flex-col justify-end overflow-hidden rounded-[1.75rem] p-4 text-primary-foreground", className)}>
      <Thumb name={b.name} src={b.thumbnail} className="absolute inset-0 -z-10 size-full text-6xl transition duration-500 group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-primary/95 via-primary/25 to-transparent" />
      <Arrow onDark className="absolute top-3 right-3" />
      <span className="line-clamp-2 font-display text-lg leading-tight font-extrabold">{b.name}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {b.rating !== null && (
          <span className="rounded-full bg-butter px-2 py-0.5 font-display font-extrabold text-foreground">
            ★ {b.rating.toFixed(1)}
            <span className="sr-only"> stars</span>
          </span>
        )}
        <span className="text-primary-foreground/85">{b.city.name}</span>
      </span>
    </Link>
  );
}

// Pastel category tile; the feature size shows the cover photo full-bleed, the small size lets it peek from the corner.
export async function CategoryTile({
  category,
  count,
  href,
  tone,
  feature = false,
}: {
  category: Category;
  count?: number;
  href: string;
  tone: string;
  feature?: boolean;
}) {
  const photo = (await getCoverPhotos()).categories.get(category.id);
  const label = (
    <span className="min-w-0">
      <span className={cn("block font-display leading-tight font-extrabold", feature ? "text-3xl sm:text-4xl" : "text-lg")}>{category.name}</span>
      {count !== undefined && <span className="mt-1 block text-sm font-semibold opacity-80">{plural(count, "place", "places")}</span>}
    </span>
  );

  if (feature && photo) {
    return (
      <Link href={href} className="group relative isolate flex h-full min-h-72 flex-col justify-between overflow-hidden rounded-[2rem] p-5 text-primary-foreground sm:p-6">
        <Thumb name={category.name} src={photo} className="absolute inset-0 -z-10 size-full transition duration-500 group-hover:scale-105" />
        <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-primary via-primary/30 to-transparent" />
        <span className="flex items-start justify-between">
          <span className={cn("flex size-12 items-center justify-center rounded-[1rem] text-foreground", tone)}>
            <CategoryIcon name={category.icon} className="size-6" />
          </span>
          <Arrow onDark />
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("group relative isolate flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] p-5", tone, feature ? "min-h-72 sm:p-6" : "min-h-44")}>
      {photo && (
        <Thumb
          name={category.name}
          src={photo}
          className="absolute -top-3 -right-3 -z-10 size-20 rotate-6 rounded-[1.25rem] ring-4 ring-card/60 transition-transform group-hover:rotate-0 sm:size-24"
        />
      )}
      <span className={cn("flex items-center justify-center bg-primary text-primary-foreground", feature ? "size-16 rounded-[1.25rem]" : "size-11 rounded-[0.9rem]")}>
        <CategoryIcon name={category.icon} className={feature ? "size-8" : "size-5"} />
      </span>
      <span className="flex items-end justify-between gap-2">
        {label}
        <Arrow />
      </span>
    </Link>
  );
}

// City tile: its cover photo under a mocha fade, or a pastel block with a giant initial.
export async function CityCard({ city, tone, big = false }: { city: City; tone: string; big?: boolean }) {
  const photo = (await getCoverPhotos()).cities.get(city.id);
  return (
    <Link
      href={`/${city.slug}`}
      className={cn(
        "group relative isolate flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[1.75rem] p-5",
        big ? "min-h-80 sm:p-7" : "min-h-48",
        photo ? "text-primary-foreground" : tone,
      )}
    >
      {photo ? (
        <>
          <Thumb name={city.name} src={photo} className="absolute inset-0 -z-10 size-full transition duration-500 group-hover:scale-105" />
          <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-primary/90 via-primary/25 to-primary/5" />
        </>
      ) : (
        <span aria-hidden className={cn("absolute -right-1 -bottom-8 -z-10 font-display leading-none font-extrabold opacity-15", big ? "text-[15rem]" : "text-[9rem]")}>
          {city.name[0]}
        </span>
      )}
      <span className="flex items-start justify-between gap-3">
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", photo ? "bg-primary-foreground/15 backdrop-blur" : "bg-card/70")}>{city.country}</span>
        <Arrow onDark={!!photo} />
      </span>
      <span>
        <span className={cn("block font-display leading-none font-extrabold tracking-tight", big ? "text-4xl sm:text-6xl" : "text-2xl")}>{city.name}</span>
        <span className="mt-2 block text-sm font-semibold opacity-85">
          {plural(city.listed, "place", "places")} · {plural(city.categoryCount, "category", "categories")}
        </span>
      </span>
    </Link>
  );
}

// A customer's line from a review, as a pastel speech tile.
export function QuoteTile({ business: b, tone, big = false }: { business: Business; tone: string; big?: boolean }) {
  return (
    <figure className={cn("flex h-full flex-col rounded-[1.75rem] rounded-bl-md p-6", tone, big && "sm:p-8")}>
      <Quote aria-hidden className="size-8 fill-current stroke-none opacity-25" />
      <blockquote className={cn("mt-3 flex-1", big ? "font-display text-2xl leading-snug font-bold tracking-tight sm:text-3xl" : "leading-relaxed")}>
        &ldquo;{b.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Thumb name={b.name} src={b.thumbnail} className="size-11 rounded-full text-xs ring-3 ring-card/70" />
        <span className="min-w-0 text-sm">
          <Link href={businessPath(b)} className="block truncate font-bold underline-offset-4 hover:underline">
            {b.name}
          </Link>
          <span className="block truncate text-muted-foreground">{b.city.name}</span>
        </span>
      </figcaption>
    </figure>
  );
}

// A mock-up of an owner's page: placeholders only, no made-up business.
export function SampleListing() {
  const rows = [
    { icon: Globe, text: "yourwebsite.com" },
    { icon: Phone, text: "Your phone number" },
    { icon: MapPin, text: "Your street address" },
  ];
  return (
    <div aria-hidden className="mx-auto w-full max-w-sm -rotate-2 rounded-[1.75rem] bg-card p-4 text-foreground transition-transform hover:rotate-0">
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-[1rem] bg-peach">
          <Store className="size-6" />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold">Your business</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Stars value={5} className="size-3.5" /> your reviews
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.text} className="flex items-center gap-2.5 rounded-[0.9rem] bg-tint px-3 py-2.5">
            <r.icon className="size-4" /> {r.text}
          </li>
        ))}
        <li className="flex items-center justify-between rounded-[0.9rem] bg-matcha px-3 py-2.5">
          <span className="font-bold">Open now</span> your hours
        </li>
      </ul>
    </div>
  );
}

// Big mocha tile for owners, with the sample page on a peach block.
export function ClaimBanner() {
  return (
    <section aria-labelledby="owners-h" className="grid items-center gap-8 rounded-[2.5rem] bg-primary p-6 text-primary-foreground sm:p-12 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <Kicker className="text-butter">For business owners</Kicker>
        <h2 id="owners-h" className="mt-4 text-4xl text-balance sm:text-5xl">
          Own a corner of the city? Make your page shine.
        </h2>
        <p className="mt-4 max-w-lg text-primary-foreground/80">
          Your business may already be on {SITE_NAME}. Claim your free page to fix your hours, reply to reviews and link to your
          website. No fees, no paid placements, no catch.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/for-businesses" className="rounded-full bg-butter px-6 py-3 font-bold text-foreground hover:bg-peach">
            Claim my page
          </Link>
          <Link href="/add-a-business" className="rounded-full bg-primary-foreground/10 px-6 py-3 font-bold hover:bg-primary-foreground/20">
            Add a business
          </Link>
        </div>
      </div>
      <div className="rounded-[2rem] bg-peach px-5 py-10 sm:px-10">
        <SampleListing />
      </div>
    </section>
  );
}

// Two-tile layout for the form pages: a pastel intro tile beside the form.
export function FormShell({
  tone,
  kicker,
  title,
  intro,
  children,
}: {
  tone: string;
  kicker?: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-3 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
      <div className={cn("rounded-[2rem] p-6 sm:p-10 lg:sticky lg:top-24", tone)}>
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1 className="mt-3 text-4xl text-balance sm:text-5xl">{title}</h1>
        <div className="mt-4 space-y-4 text-muted-foreground">{intro}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
