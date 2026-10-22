import { ArrowRight, MapPin, Search } from "lucide-react";
import Form from "next/form";
import { cn } from "@/lib/utils";

// GET form to /search; next/form makes it a client-side navigation. Two toasted-cream fields and a mocha button on a card.
export function SearchForm({ q = "", loc = "", big = false }: { q?: string; loc?: string; big?: boolean }) {
  const field = cn("flex min-w-0 items-center gap-2.5 rounded-[1.1rem] bg-tint px-4 focus-within:ring-2 focus-within:ring-primary sm:flex-1", big ? "h-14" : "h-12");
  return (
    <Form action="/search" role="search" className="flex w-full flex-col gap-2 rounded-[1.6rem] bg-card p-2 text-foreground sm:flex-row">
      <label className={field}>
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="sr-only">What are you looking for?</span>
        <input name="q" defaultValue={q} placeholder="Coffee, dentists, florists…" className="w-full min-w-0 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" />
      </label>
      <label className={field}>
        <MapPin aria-hidden className="size-4 shrink-0" />
        <span className="sr-only">Where?</span>
        <input name="loc" defaultValue={loc} placeholder="City or neighbourhood" className="w-full min-w-0 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" />
      </label>
      <button
        type="submit"
        className={cn(
          "flex shrink-0 items-center justify-center gap-2 rounded-[1.1rem] bg-primary font-bold text-primary-foreground hover:bg-primary-dark",
          big ? "h-14 px-7" : "h-12 px-6",
        )}
      >
        Search <ArrowRight aria-hidden className="size-4" />
      </button>
    </Form>
  );
}
