import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Arrow } from "@/components/cards";
import { RatingPill } from "@/components/rating";
import { Thumb } from "@/components/thumb";
import { type Business, businessPath, pickBusinesses } from "@/lib/data";
import { inputClass } from "@/lib/utils";

// First step of the review, claim and edit flows: find the place by name and city.
export async function BusinessPicker({ q, path, cta }: { q: string; path: string; cta: string }) {
  const results = await pickBusinesses(q);

  return (
    <div>
      <Form action={path} role="search" className="flex gap-2 rounded-[1.6rem] bg-card p-2">
        <label htmlFor="picker-q" className="sr-only">
          Place name and city
        </label>
        <input id="picker-q" name="q" defaultValue={q} placeholder="Place name and city, e.g. Blue Bottle Tokyo" className={inputClass} />
        <button type="submit" className="flex shrink-0 items-center gap-2 rounded-[1.25rem] bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-dark">
          <Search className="size-4" /> <span className="max-sm:sr-only">Find it</span>
        </button>
      </Form>

      {q && (
        <div className="mt-4">
          {results.length ? (
            <ul className="space-y-2.5">
              {results.map((b) => (
                <li key={b.id}>
                  <Link href={`${path}?biz=${encodeURIComponent(b.slug)}`} className="group flex items-center gap-4 rounded-[1.5rem] bg-card p-2.5 pr-4 hover:bg-butter">
                    <Thumb name={b.name} src={b.thumbnail} className="size-14 rounded-[1.1rem] text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-extrabold tracking-tight">{b.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{b.address}</span>
                    </span>
                    <span className="hidden text-sm font-bold sm:block">{cta}</span>
                    <Arrow className="bg-primary text-primary-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[1.5rem] bg-clay p-6 text-center">
              We couldn&apos;t find &ldquo;{q}&rdquo;. Try fewer words, or{" "}
              <Link href="/add-a-business" className="link">
                add the place
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// The chosen place above a form, with a way back to the finder.
export function SelectedBusiness({ business: b, path }: { business: Business; path: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.75rem] bg-matcha p-3 pr-4">
      <Thumb name={b.name} src={b.thumbnail} className="size-16 rounded-[1.2rem] ring-3 ring-card/70" />
      <div className="min-w-0 flex-1">
        <Link href={businessPath(b)} className="block truncate font-display text-xl font-extrabold tracking-tight underline-offset-4 hover:underline">
          {b.name}
        </Link>
        <RatingPill rating={b.rating} count={b.reviewCount} className="mt-0.5" />
      </div>
      <Link href={path} className="shrink-0 rounded-full bg-card px-4 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground">
        Change
      </Link>
    </div>
  );
}

export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? "")).trim().slice(0, 120);
