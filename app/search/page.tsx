import { ArrowRight, SearchX } from "lucide-react";
import Link from "next/link";
import { firstParam } from "@/components/business-picker";
import { Kicker, PageHeader, PlaceCard } from "@/components/cards";
import { areaView, GoogleMap } from "@/components/google-map";
import { SearchForm } from "@/components/search-form";
import {
  type Category,
  findCategory,
  getCategories,
  getCategoryCities,
  getCities,
  getCityListings,
  listingPath,
  SEARCH_COUNT_CAP,
  SEARCH_FEATURES,
  SEARCH_PAGE_SIZE,
  type SearchFeature,
  type SearchParams,
  searchBusinesses,
  type Sort,
  SORTS,
} from "@/lib/data";
import { formatCount } from "@/lib/format";
import { pageMeta } from "@/lib/site";
import { categoryHref, cn, pill } from "@/lib/utils";

const RATINGS = [4, 4.5];

type Raw = Awaited<PageProps<"/search">["searchParams"]>;

function parse(sp: Raw): SearchParams & { page: number } {
  const sort = firstParam(sp.sort);
  return {
    q: firstParam(sp.q),
    loc: firstParam(sp.loc),
    sort: Object.hasOwn(SORTS, sort) ? (sort as Sort) : "best",
    rating: RATINGS.includes(Number(firstParam(sp.rating))) ? Number(firstParam(sp.rating)) : 0,
    price: firstParam(sp.price),
    features: firstParam(sp.features)
      .split(",")
      .filter((f): f is SearchFeature => Object.hasOwn(SEARCH_FEATURES, f)),
    page: Math.max(1, Math.floor(Number(firstParam(sp.page))) || 1),
  };
}

// A /search URL from the current params plus changes, leaving out defaults.
function hrefFor(s: SearchParams, changes: Partial<SearchParams & { page: number }>) {
  const next = { ...s, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.loc) params.set("loc", next.loc);
  if (next.sort !== "best") params.set("sort", next.sort);
  if (next.rating) params.set("rating", String(next.rating));
  if (next.price) params.set("price", next.price);
  if (next.features.length) params.set("features", next.features.join(","));
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export async function generateMetadata({ searchParams }: PageProps<"/search">) {
  const { q, loc } = parse(await searchParams);
  return pageMeta({
    title: q || loc ? `${q || "Places"}${loc ? ` in ${loc}` : ""}` : "Search places",
    description: "Search local places by what they do and where they are.",
    path: "/search",
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const s = parse(await searchParams);
  const page = Math.min(s.page, Math.ceil(SEARCH_COUNT_CAP / SEARCH_PAGE_SIZE));
  const category = await findCategory(s.q);
  const [{ results, total, prices }, shortcut, cityLists] = await Promise.all([
    searchBusinesses(s, page, category),
    findListing(category, s.loc),
    category && !s.loc ? getCategoryCities(category) : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(Math.min(total, SEARCH_COUNT_CAP) / SEARCH_PAGE_SIZE));
  const offset = (page - 1) * SEARCH_PAGE_SIZE;
  const mapArea = areaView(results.flatMap((b) => (b.geo ? [b.geo] : []))); // none when results span cities
  const filtered = s.rating || s.price || s.features.length;
  const what = category?.name ?? (s.q || "Places");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3">
      <PageHeader
        stats={[{ value: total > SEARCH_COUNT_CAP ? `${formatCount(SEARCH_COUNT_CAP)}+` : formatCount(total), label: total === 1 ? "place found" : "places found" }]}
      >
        <Kicker>Search every corner</Kicker>
        <h1 className="mt-3 text-4xl text-balance sm:text-6xl">{s.q || s.loc ? `${what}${s.loc ? ` in ${s.loc}` : ""}` : "All places"}</h1>
        <div className="mt-6">
          <SearchForm q={s.q} loc={s.loc} />
        </div>
      </PageHeader>

      <div aria-label="Filters" role="group" className="mt-6 space-y-3">
        <FilterRow label="Sort">
          {(Object.keys(SORTS) as Sort[]).map((key) => (
            <Link key={key} href={hrefFor(s, { sort: key })} aria-current={s.sort === key ? "true" : undefined} className={pill(s.sort === key)}>
              {SORTS[key]}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label="Filter">
          {RATINGS.map((r) => (
            <Link key={r} href={hrefFor(s, { rating: s.rating === r ? 0 : r })} aria-current={s.rating === r ? "true" : undefined} className={pill(s.rating === r)}>
              ★ {r}+
            </Link>
          ))}
          {prices.map((p) => (
            <Link key={p} href={hrefFor(s, { price: s.price === p ? "" : p })} aria-current={s.price === p ? "true" : undefined} className={pill(s.price === p)}>
              {p}
            </Link>
          ))}
          {(Object.keys(SEARCH_FEATURES) as SearchFeature[]).map((f) => {
            const on = s.features.includes(f);
            return (
              <Link key={f} href={hrefFor(s, { features: on ? s.features.filter((x) => x !== f) : [...s.features, f] })} aria-current={on ? "true" : undefined} className={pill(on)}>
                {SEARCH_FEATURES[f].label}
              </Link>
            );
          })}
          {filtered ? (
            <Link href={hrefFor(s, { rating: 0, price: "", features: [] })} className="link px-3 py-2 text-sm">
              Clear
            </Link>
          ) : null}
        </FilterRow>
      </div>

      {cityLists.length > 0 && (
        <nav aria-label={`${category!.name} by city`} className="mt-6 rounded-[2rem] bg-matcha p-5 sm:p-6">
          <p className="font-display text-xl font-extrabold tracking-tight">Choose a city to see its top {category!.lower}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cityLists.map((l) => (
              <li key={l.city.slug}>
                <Link href={listingPath(l)} className="inline-flex rounded-full bg-card/75 px-4 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
                  {l.city.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cities" className="link inline-flex px-3 py-2 text-sm">
                All cities
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {shortcut && (
        <Link
          href={listingPath(shortcut)}
          className="group mt-6 flex items-center justify-between gap-3 rounded-[1.75rem] bg-primary p-3 pl-6 font-display text-lg font-extrabold tracking-tight text-primary-foreground hover:bg-primary-dark"
        >
          Open the top {shortcut.category.lower} in {shortcut.city.name} list
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-butter text-foreground transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </span>
        </Link>
      )}

      {mapArea && <GoogleMap area={mapArea} title="Map of the area" className="mt-6 hidden h-56 rounded-[2rem] md:block" />}

      {results.length ? (
        <>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((b, i) => (
              <li key={b.id}>
                <PlaceCard business={b} rank={offset + i + 1} />
              </li>
            ))}
          </ol>
          {pages > 1 && <Pagination page={page} pageCount={pages} href={(p) => hrefFor(s, { page: p })} />}
        </>
      ) : (
        <EmptyState clearHref={filtered ? hrefFor(s, { rating: 0, price: "", features: [] }) : null} />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 whitespace-nowrap">
      <span className="w-14 shrink-0 text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
      {children}
    </div>
  );
}

// First, last and the neighbours of the current page; gaps become "…".
function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (p: number) => string }) {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return (
    <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={pill()}>
          ← Back
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-muted-foreground">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn(pill(p === page), "size-10 justify-center px-0")}>
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className={pill()}>
          More →
        </Link>
      )}
    </nav>
  );
}

async function EmptyState({ clearHref }: { clearHref: string | null }) {
  const [categories, cities] = await Promise.all([getCategories(), getCities()]);
  const popular = [...categories].sort((a, b) => b.total - a.total).slice(0, 6);
  return (
    <div className="mt-8 rounded-[2.5rem] bg-clay px-6 py-14 text-center">
      <span className="mx-auto flex size-20 -rotate-6 items-center justify-center rounded-[1.5rem] bg-primary text-primary-foreground">
        <SearchX className="size-9" />
      </span>
      <h2 className="mt-6 text-4xl">This corner&apos;s empty</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">Try a broader word like &ldquo;dentist&rdquo;, check the spelling, or search the whole city.</p>
      {clearHref && (
        <Link href={clearHref} className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary-dark">
          Clear the filters
        </Link>
      )}
      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {popular.map((c) => (
          <li key={c.slug}>
            <Link href={categoryHref(c.name)} className="inline-flex rounded-full bg-card/75 px-4 py-2 text-sm font-bold hover:bg-card">
              {c.name}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/cities" className={pill(true)}>
            {formatCount(cities.length)} cities
          </Link>
        </li>
      </ul>
    </div>
  );
}

// "dentist" in "Tokyo" names a list we publish: offer it straight away.
async function findListing(category: Category | undefined, loc: string) {
  const want = loc.trim().toLowerCase();
  if (!category || !want) return undefined;
  const city = (await getCities()).find((c) => [c.name, c.label, c.slug].some((n) => n.toLowerCase() === want));
  return city && (await getCityListings(city)).find((l) => l.category.id === category.id);
}
