import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { iconFor, schemaTypeFor } from "@/lib/category-meta";
import { sql } from "@/lib/db";
import { FEATURED_CITIES } from "@/lib/site";
import { slugify } from "@/lib/slug";

// Directory data comes from the scraper's Postgres database (read-only login, see lib/db.ts).
// Pages are rendered on first visit and cached (revalidate in app/layout.tsx); small lookups are memoised here.

export const MIN_CATEGORY_PAGE = 5; // a city+category page needs this many businesses
export const MIN_AREA_PAGE = 3; // an area page needs this many
// businesses.score is computed upstream as a Bayesian average: every business starts with
// PRIOR_REVIEWS reviews of PRIOR_RATING stars, then its own reviews move it.
export const PRIOR_REVIEWS = 10;
export const PRIOR_RATING = 3.5;

// ── Types ───────────────────────────────────────────────────

export type Category = {
  id: number;
  slug: string;
  name: string; // "Hair salons"
  singular: string; // "Hair salon"
  lower: string; // "hair salons", for running text
  singularLower: string;
  icon: string;
  group: string;
  groupSlug: string;
  schemaType: string;
  total: number; // businesses across published lists
};
export type Group = { name: string; slug: string; icon: string; total: number; categories: Category[] };
export type City = {
  id: number;
  slug: string;
  name: string;
  state: string | null;
  countryCode: string;
  country: string;
  label: string; // "San Diego, California"
  listed: number;
  categoryCount: number;
};
export type Area = { slug: string; name: string };

export type Business = {
  id: number;
  slug: string;
  name: string;
  address: string;
  city: City;
  area: Area | null;
  rating: number | null;
  reviewCount: number;
  score: number;
  type: string | null;
  types: string[];
  price: string | null;
  phone: string | null;
  website: string | null; // http(s) only
  description: string | null;
  hours: [day: string, hours: string][]; // Monday first
  serviceOptions: Record<string, boolean>;
  extensions: { group: string; items: string[] }[];
  geo: { lat: number; lng: number } | null;
  thumbnail: string | null; // http(s) only
  quote: string | null;
  mapsUrl: string | null; // the listing on Google Maps, where its reviews live
};

export type Listing = { city: City; category: Category; area: Area | null; businesses: Business[] };

// ── Untrusted fields ────────────────────────────────────────

// Scraped data: a malformed value drops that field, never the business.
const opt = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);
const text = z.string().trim().min(1);
export const httpUrl = text.refine((s) => /^https?:\/\//i.test(s) && URL.canParse(s));

// Google photos are scraped as tiny thumbnails (…=w122-h92-k-no) that blur on a card, so ask for 800×600.
// Street View thumbnails answer 403 without a Google session, so they're dropped (the card shows initials).
export function photoUrl(raw: string | null) {
  if (!httpUrl.safeParse(raw).success) return null;
  const url = raw!.trim();
  if (new URL(url).hostname === "streetviewpixels-pa.googleapis.com") return null;
  return url.replace(/=w\d+-h\d+(-k-no)?$/, "=w800-h600-k-no");
}
const hoursSchema = opt(z.record(z.string(), text));
const servicesSchema = opt(z.record(z.string(), z.boolean()));
const extensionsSchema = opt(z.array(z.record(z.string(), z.array(text))));

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Google's price field sometimes holds a one-line summary instead ("Casual spot for South Indian food").
const isPrice = (s: string) => s.length <= 16 && /[\p{Sc}\d]/u.test(s);

export type BusinessRow = {
  id: number;
  slug: string;
  title: string;
  city_id: number;
  area: string | null;
  area_slug: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number;
  score: number;
  price: string | null;
  primary_type: string | null;
  types: string[] | null;
  description: string | null;
  user_review: string | null;
  operating_hours: unknown;
  service_options: unknown;
  extensions: unknown;
  latitude: number | null;
  longitude: number | null;
  thumbnail: string | null;
  data_cid: string | null;
};

const COLUMNS = `b.id, b.slug, b.title, b.city_id, b.area, b.area_slug, b.address, b.phone, b.website, b.rating, b.review_count,
  b.score, b.price, b.primary_type, b.types, b.description, b.user_review, b.operating_hours, b.service_options, b.extensions,
  b.latitude, b.longitude, b.thumbnail, b.data_cid`;

export function toBusiness(r: BusinessRow, city: City): Business {
  const hours = Object.entries(hoursSchema.parse(r.operating_hours) ?? {}).map(([d, h]) => [d.toLowerCase(), h] as [string, string]);
  hours.sort(([a], [b]) => ((DAYS.indexOf(a) + 8) % 8) - ((DAYS.indexOf(b) + 8) % 8)); // unknown keys last
  const price = r.price?.trim() || null;
  const types = [...new Set([r.primary_type, ...(r.types ?? [])].filter((t): t is string => !!t?.trim()))];
  return {
    id: r.id,
    slug: r.slug,
    name: r.title,
    address: r.address,
    city,
    area: r.area_slug && r.area ? { slug: r.area_slug, name: r.area } : null,
    rating: r.rating,
    reviewCount: r.review_count,
    score: r.score,
    type: r.primary_type?.trim() || null,
    types,
    price: price && isPrice(price) ? price : null,
    phone: r.phone?.trim() || null,
    website: httpUrl.safeParse(r.website).success ? r.website!.trim() : null,
    description: r.description?.trim() || (price && !isPrice(price) ? price : null),
    hours,
    serviceOptions: servicesSchema.parse(r.service_options) ?? {},
    extensions: (extensionsSchema.parse(r.extensions) ?? []).flatMap((e) => Object.entries(e).map(([group, items]) => ({ group, items }))),
    geo: r.latitude !== null && r.longitude !== null ? { lat: r.latitude, lng: r.longitude } : null,
    thumbnail: photoUrl(r.thumbnail),
    quote: r.user_review?.replace(/^["“'\s]+|["”'\s]+$/g, "") || null,
    mapsUrl: r.data_cid && /^\d+$/.test(r.data_cid) ? `https://www.google.com/maps?cid=${r.data_cid}` : null,
  };
}

// ── Category names ──────────────────────────────────────────

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// Lowercase for running text, keeping acronyms and brand casing ("ENT doctors", "MacBook repair").
const lowerWords = (s: string) =>
  s
    .split(" ")
    .map((w) => (/.\p{Lu}/u.test(w) ? w : w.toLowerCase()))
    .join(" ");

// "hair salon" -> "Hair salons"; names already plural or title-cased by hand are kept as they are.
export function categoryNames(raw: string) {
  const words = raw.trim().split(/\s+/);
  const last = words.at(-1)!;
  let plural = raw.trim();
  if (last === last.toLowerCase() && !/s$/.test(last)) {
    if (["repair", "control", "massage"].includes(last)) plural += " services";
    else plural = [...words.slice(0, -1), last.replace(/([^aeiou])y$/, "$1ie").replace(/(sh|ch|x|z)$/, "$1e") + "s"].join(" ");
  }
  return { name: capFirst(plural), singular: capFirst(raw.trim()), lower: lowerWords(plural), singularLower: lowerWords(raw.trim()) };
}

// ── Search text ─────────────────────────────────────────────

// Words to a Postgres tsquery: letters and digits only, each a prefix, all required. "dent band" finds
// dentists in Bandra. The search column uses the 'simple' config (no stemming), so plurals are trimmed
// here: "restaurants" -> "restaurant:*", "pharmacies" -> "pharmacy:*".
export function toTsQuery(...parts: string[]) {
  const words = parts.join(" ").normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words
    .slice(0, 10)
    .map((w) => (w.length > 3 ? w.replace(/ies$/, "y").replace(/([^s])s$/, "$1") : w))
    .map((w) => `${w}:*`)
    .join(" & ");
}

// ── Memoised lookups ────────────────────────────────────────

// Per process, refreshed hourly; a failed load is retried on the next call.
function memo<T>(load: () => Promise<T>, ttlMs = 60 * 60 * 1000) {
  let entry: { at: number; value: Promise<T> } | undefined;
  return () => {
    if (!entry || Date.now() - entry.at > ttlMs) {
      const value = load();
      entry = { at: Date.now(), value };
      value.catch(() => entry?.value === value && (entry = undefined));
    }
    return entry.value;
  };
}

const featuredRank = (slug: string) => {
  const i = FEATURED_CITIES.indexOf(slug);
  return i === -1 ? FEATURED_CITIES.length : i;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => {
  try {
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

// Every published city+category list with its size (~22,000 rows). Cached, it answers what most pages
// ask (category totals, a city's lists, other cities) without re-aggregating 220,000 rows each time.
const publishedLists = memo(() =>
  sql<{ city_id: number; category_id: number; businesses: number }>(
    `select city_id, category_id, businesses from city_category_counts where businesses >= $1 order by businesses desc, city_id, category_id`,
    [MIN_CATEGORY_PAGE],
  ),
);

const taxonomy = memo(async () => {
  const [catRows, cityRows, lists] = await Promise.all([
    sql<{ id: number; name: string; slug: string; group_name: string | null }>(
      `select id, name, slug, group_name from categories order by sort_order nulls last, name`,
    ),
    sql<{ id: number; name: string; state: string | null; country_code: string; slug: string }>(
      `select id, name, state, country_code, slug from cities`,
    ),
    publishedLists(),
  ]);
  const totalByCategory = new Map<number, number>();
  const byCity = new Map<number, { listed: number; categories: number }>();
  for (const l of lists) {
    totalByCategory.set(l.category_id, (totalByCategory.get(l.category_id) ?? 0) + l.businesses);
    const c = byCity.get(l.city_id) ?? { listed: 0, categories: 0 };
    c.listed += l.businesses;
    c.categories += 1;
    byCity.set(l.city_id, c);
  }

  const categories = catRows.map((r): Category => {
    const group = r.group_name?.trim() || "Other";
    return {
      id: r.id,
      slug: r.slug,
      ...categoryNames(r.name),
      icon: iconFor(r.slug, group),
      group,
      groupSlug: slugify(group),
      schemaType: schemaTypeFor(r.slug, group),
      total: totalByCategory.get(r.id) ?? 0,
    };
  });
  const groups = [...Map.groupBy(categories, (c) => c.group)]
    .map(([name, cats]): Group => ({
      name,
      slug: slugify(name),
      icon: iconFor("", name),
      total: cats.reduce((n, c) => n + c.total, 0),
      categories: cats.sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);
  const cities = cityRows
    .filter((r) => byCity.has(r.id))
    .map(
      (r): City => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        state: r.state,
        countryCode: r.country_code,
        country: countryName(r.country_code),
        label: r.state && r.state !== r.name ? `${r.name}, ${r.state}` : r.name,
        listed: byCity.get(r.id)!.listed,
        categoryCount: byCity.get(r.id)!.categories,
      }),
    )
    // Featured cities lead every city list (lib/site.ts), then the most listings.
    .sort((a, b) => featuredRank(a.slug) - featuredRank(b.slug) || b.listed - a.listed || a.name.localeCompare(b.name));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const cityById = new Map(cities.map((c) => [c.id, c]));
  return {
    groups,
    categories,
    categoryById,
    categoryBySlug: new Map(categories.map((c) => [c.slug, c])),
    cities,
    cityById,
    cityBySlug: new Map(cities.map((c) => [c.slug, c])),
    // Biggest first (ties in city order), resolved to city and category objects.
    lists: lists
      .flatMap((l) => {
        const city = cityById.get(l.city_id);
        const category = categoryById.get(l.category_id);
        return city && category ? [{ city, category, area: null, count: l.businesses, rank: cities.indexOf(city) }] : [];
      })
      .sort((a, b) => b.count - a.count || a.rank - b.rank),
    published: new Set(lists.map((l) => `${l.city_id}:${l.category_id}`)),
  };
});

export const getGroups = async () => (await taxonomy()).groups;
export const getCategories = async () => (await taxonomy()).categories;
export const getCategory = async (slug: string) => (await taxonomy()).categoryBySlug.get(slug);
export const getCities = async () => (await taxonomy()).cities;
export const getCity = async (slug: string) => (await taxonomy()).cityBySlug.get(slug);

// A city typed into a form: its full label ("Austin, Texas") or a name that only one city has.
export async function findCity(text: string) {
  const t = text.trim().toLowerCase();
  const cities = await getCities();
  const named = cities.filter((c) => c.name.toLowerCase() === t);
  return cities.find((c) => c.label.toLowerCase() === t) ?? (named.length === 1 ? named[0] : undefined);
}

// Rows whose city is unpublished are dropped (they can't be linked).
async function toBusinesses(rows: BusinessRow[]) {
  const { cityById } = await taxonomy();
  return rows.flatMap((r) => {
    const city = cityById.get(r.city_id);
    return city ? [toBusiness(r, city)] : [];
  });
}

// The ~1% of businesses that no published list includes. It's a short list, so queries skip them by id
// rather than checking every business against city_category_counts.
const unpublishedIds = memo(async () =>
  (
    await sql<{ id: number }>(
      `select b.id from businesses b where not exists (
         select 1 from business_categories bc
         join city_category_counts cc on cc.city_id = bc.city_id and cc.category_id = bc.category_id
         where bc.business_id = b.id and cc.businesses >= $1)`,
      [MIN_CATEGORY_PAGE],
    )
  ).map((r) => r.id),
);

// SQL condition keeping published businesses; `placeholder` is bound to unpublishedIds().
const published = (placeholder: string) => `not (b.id = any(${placeholder}::bigint[]))`;

export const getStats = memo(async () => {
  const [row] = await sql<{ businesses: number; reviews: number }>(
    `select count(*)::int as businesses, coalesce(sum(b.review_count), 0)::bigint as reviews from businesses b where ${published("$1")}`,
    [await unpublishedIds()],
  );
  return row;
});

// ── Lists ───────────────────────────────────────────────────

export const listingPath = (l: { city: Pick<City, "slug">; category: Pick<Category, "slug">; area?: Area | null }) =>
  `/${l.city.slug}/${l.category.slug}${l.area ? `/${l.area.slug}` : ""}`;

export const businessPath = (b: Pick<Business, "slug">) => `/biz/${encodeURIComponent(b.slug)}`;

// Published categories in a city, biggest first.
export async function getCityListings(city: City) {
  return (await taxonomy()).lists.filter((l) => l.city.id === city.id);
}

// Published neighbourhood lists in a city, optionally for one category.
export async function getAreaListings(city: City, category?: Category) {
  const { categoryById } = await taxonomy();
  const rows = await sql<{ category_id: number; area: string; area_slug: string; businesses: number }>(
    `select category_id, area, area_slug, businesses from listing_areas
     where city_id = $1 and ($2::bigint is null or category_id = $2) and businesses >= $3
     order by businesses desc, area`,
    [city.id, category?.id ?? null, MIN_AREA_PAGE],
  );
  return rows.flatMap((r) => {
    const cat = categoryById.get(r.category_id);
    return cat ? [{ city, category: cat, area: { slug: r.area_slug, name: r.area }, count: r.businesses }] : [];
  });
}

// One ranked list, or undefined when it doesn't exist or is too thin to publish.
export async function getListing(citySlug: string, categorySlug: string, areaSlug?: string): Promise<Listing | undefined> {
  const [city, category] = await Promise.all([getCity(citySlug), getCategory(categorySlug)]);
  if (!city || !category) return undefined;
  const rows = await sql<BusinessRow>(
    `select ${COLUMNS} from business_categories bc join businesses b on b.id = bc.business_id
     where bc.city_id = $1 and bc.category_id = $2 and ($3::text is null or b.area_slug = $3)
     order by b.score desc, b.review_count desc, b.title`,
    [city.id, category.id, areaSlug ?? null],
  );
  if (rows.length < (areaSlug ? MIN_AREA_PAGE : MIN_CATEGORY_PAGE)) return undefined;
  const businesses = rows.map((r) => toBusiness(r, city));
  // Same spelling rule as the listing_areas view: the alphabetically first one.
  const area = areaSlug ? { slug: areaSlug, name: businesses.map((b) => b.area!.name).sort()[0] } : null;
  return { city, category, area, businesses };
}

// The same category in other cities: same country first, then the biggest lists.
export async function getOtherCities(category: Category, city: City, limit = 8) {
  return (await taxonomy()).lists
    .filter((l) => l.category.id === category.id && l.city.id !== city.id)
    .sort(
      (a, b) =>
        Number(b.city.countryCode === city.countryCode) - Number(a.city.countryCode === city.countryCode) ||
        b.count - a.count ||
        a.rank - b.rank,
    )
    .slice(0, limit);
}

// Cities with the biggest published list for a category.
export async function getCategoryCities(category: Category, limit = 12) {
  return (await taxonomy()).lists.filter((l) => l.category.id === category.id).slice(0, limit);
}

// Highest-scored published businesses, overall or in one city; optionally only ones with a quote.
export async function getTopBusinesses({ city, limit, withQuote = false }: { city?: City; limit: number; withQuote?: boolean }) {
  const rows = await sql<BusinessRow>(
    `select ${COLUMNS} from businesses b
     where ($1::bigint is null or b.city_id = $1) and ${withQuote ? "coalesce(b.user_review, '') <> '' and" : ""} ${published("$3")}
     order by b.score desc, b.review_count desc limit $2`,
    [city?.id ?? null, limit, await unpublishedIds()],
  );
  return toBusinesses(rows);
}

// ── One business ────────────────────────────────────────────

// The business with its published categories (first = best Google position), or undefined if unpublished.
export async function getBusiness(slug: string) {
  const [row] = await sql<BusinessRow>(`select ${COLUMNS} from businesses b where b.slug = $1`, [slug]);
  if (!row) return undefined;
  const [{ categoryById, cityById, published: isPublished }, cats] = await Promise.all([
    taxonomy(),
    sql<{ category_id: number; city_id: number }>(
      `select category_id, city_id from business_categories where business_id = $1 order by google_position nulls last, category_id`,
      [row.id],
    ),
  ]);
  const city = cityById.get(row.city_id);
  const categories = cats.flatMap((c) => (isPublished.has(`${c.city_id}:${c.category_id}`) ? (categoryById.get(c.category_id) ?? []) : []));
  if (!city || !categories.length) return undefined;
  return { business: toBusiness(row, city), categories };
}

export async function businessExists(slug: string) {
  const rows = await sql(`select 1 from businesses b where b.slug = $1 and ${published("$2")}`, [slug, await unpublishedIds()]);
  return rows.length > 0;
}

// Others in the same list, neighbours in the same area first.
export async function getNearby(b: Business, category: Category, limit = 4) {
  const rows = await sql<BusinessRow>(
    `select ${COLUMNS} from business_categories bc join businesses b on b.id = bc.business_id
     where bc.city_id = $1 and bc.category_id = $2 and b.id <> $3
     order by (b.area_slug is not null and b.area_slug = $4) desc, b.score desc limit $5`,
    [b.city.id, category.id, b.id, b.area?.slug ?? null, limit],
  );
  return rows.map((r) => toBusiness(r, b.city));
}

// ── Search ──────────────────────────────────────────────────

export const opensOnSunday = (b: Business) => b.hours.some(([d, h]) => d === "sunday" && !/closed/i.test(h));

// Each filter as a check on a loaded business (card highlights) and as SQL (search). The SQL is constant text.
export const SEARCH_FEATURES = {
  "open-sunday": {
    label: "Open on Sunday",
    test: opensOnSunday,
    sql: `coalesce(b.operating_hours->>'sunday', '') <> '' and b.operating_hours->>'sunday' !~* 'closed'`,
  },
  website: { label: "Has a website", test: (b: Business) => !!b.website, sql: `b.website ~* '^https?://'` },
  wheelchair: {
    label: "Wheelchair accessible",
    test: (b: Business) => b.extensions.some((e) => e.items.some((i) => /wheelchair/i.test(i))),
    sql: `b.extensions::text ilike '%wheelchair%'`,
  },
  "online-appointments": {
    label: "Online appointments",
    test: (b: Business) => !!b.serviceOptions.online_appointments,
    sql: `b.service_options->>'online_appointments' = 'true'`,
  },
} satisfies Record<string, { label: string; test: (b: Business) => boolean; sql: string }>;

export type SearchFeature = keyof typeof SEARCH_FEATURES;
export const SORTS = { best: "Recommended", rating: "Highest rated", reviews: "Most reviewed" } as const;
export type Sort = keyof typeof SORTS;
const ORDER: Record<Sort, string> = {
  best: "b.score desc, b.review_count desc",
  rating: "b.rating desc nulls last, b.review_count desc",
  reviews: "b.review_count desc, b.score desc",
};

export type SearchParams = { q: string; loc: string; sort: Sort; rating: number; price: string; features: SearchFeature[] };
export const SEARCH_PAGE_SIZE = 10;
export const SEARCH_COUNT_CAP = 1000;

// When the query names a category ("Restaurants"), search that category rather than the words.
export async function findCategory(q: string) {
  const want = q.trim().toLowerCase();
  if (!want) return undefined;
  return (await getCategories()).find((c) => [c.name, c.singular, c.slug].some((n) => n.toLowerCase() === want));
}

// What and where are matched together against name, types and address. Counting stops at
// SEARCH_COUNT_CAP so broad searches stay fast.
export async function searchBusinesses(s: SearchParams, page: number, category?: Category) {
  const params: unknown[] = [await unpublishedIds()];
  const where = [published("$1")];
  const add = (fragment: (placeholder: string) => string, value: unknown) => {
    params.push(value);
    where.push(fragment(`$${params.length}`));
  };
  if (category) add((p) => `exists (select 1 from business_categories sbc where sbc.business_id = b.id and sbc.category_id = ${p})`, category.id);
  const tsq = category ? toTsQuery(s.loc) : toTsQuery(s.q, s.loc);
  if (tsq) add((p) => `b.search @@ to_tsquery('simple', ${p})`, tsq);
  const base = [...where];
  const baseParams = [...params];
  if (s.rating) add((p) => `b.rating >= ${p}`, s.rating);
  if (s.price) add((p) => `b.price = ${p}`, s.price);
  for (const f of s.features) where.push(SEARCH_FEATURES[f].sql);

  const clause = where.join(" and ");
  const [rows, [count], prices] = await Promise.all([
    sql<BusinessRow>(
      `select ${COLUMNS} from businesses b where ${clause} order by ${ORDER[s.sort]} limit ${SEARCH_PAGE_SIZE} offset $${params.length + 1}`,
      [...params, (page - 1) * SEARCH_PAGE_SIZE],
    ),
    sql<{ n: number }>(`select count(*)::int as n from (select 1 from businesses b where ${clause} limit ${SEARCH_COUNT_CAP + 1}) t`, params),
    // Price filter options: symbol-only prices ("$$", "₹₹₹") among the unfiltered matches.
    sql<{ price: string }>(
      `select distinct b.price from businesses b where ${base.join(" and ")} and b.price ~ '^[$€£¥₹₩₽₺₫₱฿]{1,4}$' order by 1 limit 6`,
      baseParams,
    ),
  ]);
  return { results: await toBusinesses(rows), total: count.n, prices: prices.map((p) => p.price).sort((a, b) => a.length - b.length) };
}

// Business lookup for the review, claim and edit forms.
export async function pickBusinesses(q: string) {
  const tsq = toTsQuery(q);
  if (!tsq) return [];
  const rows = await sql<BusinessRow>(
    `select ${COLUMNS} from businesses b where b.search @@ to_tsquery('simple', $1) and ${published("$2")} order by b.score desc limit 10`,
    [tsq, await unpublishedIds()],
  );
  return toBusinesses(rows);
}

// ── Sitemap ─────────────────────────────────────────────────

export const SITEMAP_SIZE = 45_000; // Google allows 50,000 URLs per file

export async function getListingPaths() {
  const [{ categoryById, cityById, lists }, areas] = await Promise.all([
    taxonomy(),
    sql<{ city_id: number; category_id: number; area_slug: string }>(
      `select city_id, category_id, area_slug from listing_areas where businesses >= $1`,
      [MIN_AREA_PAGE],
    ),
  ]);
  const areaPaths = areas.flatMap((r) => {
    const city = cityById.get(r.city_id);
    const category = categoryById.get(r.category_id);
    return city && category ? [listingPath({ city, category, area: { slug: r.area_slug, name: "" } })] : [];
  });
  return [...lists.map(listingPath), ...areaPaths];
}

// One sitemap file's worth of published business slugs, in id order.
export async function getBusinessSlugs(chunk: number) {
  const rows = await sql<{ slug: string }>(`select b.slug from businesses b where ${published("$3")} order by b.id limit $1 offset $2`, [
    SITEMAP_SIZE,
    chunk * SITEMAP_SIZE,
    await unpublishedIds(),
  ]);
  return rows.map((r) => r.slug);
}

// ── Photos ──────────────────────────────────────────────────

// Optional photos by convention: drop public/images/{cities,categories}/<slug>.jpg and it gets used.
export function photoFor(kind: "cities" | "categories", slug: string) {
  const src = `/images/${kind}/${slug}.jpg`;
  return existsSync(path.join(process.cwd(), "public", src)) ? src : null;
}

// Cover photos for city and category tiles, by id: the photo of the best-scored business there, so tiles
// need no stock photos and follow the site's own data. Each id gets a photo no other id has, where it can.
// Ids without one are missing; fall back to photoFor() or a colour tile.
export const getCoverPhotos = memo(async () => {
  const query = (from: string, key: string) =>
    sql<{ id: number; thumbnail: string }>(
      `select id, thumbnail from (
         select ${key} as id, b.thumbnail, row_number() over (partition by ${key} order by b.score desc, b.id) as n
         from ${from} where b.thumbnail ~* '^https?://') t
       where n <= 6 order by id, n`,
    );
  const pick = (rows: { id: number; thumbnail: string }[]) => {
    const used = new Set<string>();
    const covers = new Map<number, string>();
    for (const r of rows) {
      const url = photoUrl(r.thumbnail);
      if (!url || covers.has(r.id) || used.has(url)) continue;
      covers.set(r.id, url);
      used.add(url);
    }
    return covers;
  };
  const [categories, cities] = await Promise.all([
    query("business_categories bc join businesses b on b.id = bc.business_id", "bc.category_id"),
    query("businesses b", "b.city_id"),
  ]);
  return { categories: pick(categories), cities: pick(cities) };
});
