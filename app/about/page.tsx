import { Mail } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Kicker, PageHeader } from "@/components/cards";
import { toneAt } from "@/components/thumb";
import { getCities, getStats, MIN_AREA_PAGE, MIN_CATEGORY_PAGE, PRIOR_RATING, PRIOR_REVIEWS } from "@/lib/data";
import { formatCount } from "@/lib/format";
import { CONTACT_EMAIL, pageMeta, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata = pageMeta({
  title: "Our story, how we rank and our review rules",
  description: `Why ${SITE_NAME} exists, exactly how places are ranked, the rules every review follows, and how to reach us.`,
  path: "/about",
});

const rules = [
  ["Been there yourself", "Write about places you've actually used, and about what happened to you."],
  ["Stay on topic", "The service, the price, the people. Leave out unrelated arguments."],
  ["Be kind, even when it went wrong", "No threats, insults, harassment or hate."],
  ["Keep it private", "No phone numbers, home addresses or full names of staff or other customers."],
  ["No reviewing yourself", "Owners and staff can't review their own place, or a rival's."],
  ["Nothing in return", "No reviews for discounts, gifts or money, and businesses mustn't offer them."],
];

const h2 = "scroll-mt-24 text-4xl sm:text-5xl";

export default async function AboutPage() {
  const [stats, cities] = await Promise.all([getStats(), getCities()]);
  // Same formula as businesses.score in the database.
  const example = (rating: number, count: number) => ((PRIOR_RATING * PRIOR_REVIEWS + rating * count) / (PRIOR_REVIEWS + count)).toFixed(2);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <Breadcrumbs items={[{ name: "Our story", href: "/about" }]} />
      <PageHeader
        stats={[
          { value: formatCount(stats.businesses), label: "places listed" },
          { value: formatCount(cities.length), label: cities.length === 1 ? "city" : "cities" },
          { value: formatCount(stats.reviews), label: "reviews counted" },
        ]}
      >
        <Kicker>Our story</Kicker>
        <h1 className="mt-4 text-5xl leading-[0.95] text-balance sm:text-7xl">Hello from every corner</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          We made {SITE_NAME} so finding a good local place feels simple and fair. Look up a café, a dentist or a plumber by city
          and neighbourhood, see how people rate them, and contact them directly. No ads, no sponsored spots, no paid plans.
        </p>
      </PageHeader>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-[2rem] bg-card p-6 leading-relaxed sm:p-10">
          <h2 id="rankings" className={h2}>
            How we rank
          </h2>
          <p>
            Star ratings on their own reward places with hardly any reviews: two 5-star ratings would beat hundreds of 4.7s. So
            each place starts as if it had {PRIOR_REVIEWS} ratings of {PRIOR_RATING} stars, and its real reviews move it from there.
            The more people who rate a place, the more their rating counts.
          </p>
          <p>
            A place with no reviews yet stays at the {PRIOR_RATING}-star starting point. Ties go to the place with more reviews.
            Money never comes into it.
          </p>
          <p>
            We only publish a list once a city has at least {MIN_CATEGORY_PAGE} places in it, and a neighbourhood list once it has{" "}
            {MIN_AREA_PAGE}.
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <p className="flex flex-col justify-end rounded-[2rem] bg-matcha p-6">
            <span className="block font-display text-6xl font-extrabold tracking-tight">{example(4.7, 300)}</span>
            for 4.7 stars from 300 reviews
          </p>
          <p className="flex flex-col justify-end rounded-[2rem] bg-clay p-6">
            <span className="block font-display text-6xl font-extrabold tracking-tight">{example(5, 2)}</span>
            for 5.0 stars from just 2 reviews
          </p>
        </div>
      </div>

      <section className="mt-20">
        <h2 id="guidelines" className={h2}>
          Review rules
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Reviews only help if they&apos;re honest, so each one is checked against these before it goes live. We take down reviews
          that break them, but not reviews that are simply unhappy, and nobody can pay us to remove one.
        </p>
        <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map(([title, text], i) => (
            <li key={title} className={cn("rounded-[1.75rem] p-6", toneAt(i))}>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display font-extrabold text-primary-foreground">{i + 1}</span>
              <p className="mt-5 font-display text-xl font-extrabold tracking-tight">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid items-center gap-6 rounded-[2.5rem] bg-primary p-6 text-primary-foreground sm:p-12 md:grid-cols-2">
        <div>
          <h2 id="contact" className={h2}>
            Say hello
          </h2>
          <p className="mt-3 text-primary-foreground/80">Questions, corrections or a corner we should know about: we read everything.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full bg-butter px-5 py-3 font-bold break-all text-foreground hover:bg-peach">
            <Mail className="size-4 shrink-0" /> {CONTACT_EMAIL}
          </a>
        </div>
        <ul className="grid gap-2 text-sm">
          <li className="rounded-[1.25rem] bg-primary-foreground/10 p-4">
            Run a business?{" "}
            <Link href="/for-businesses" className="font-bold underline underline-offset-4">
              Claim your free page
            </Link>
          </li>
          <li className="rounded-[1.25rem] bg-primary-foreground/10 p-4">Found a mistake? Tap &ldquo;Fix info&rdquo; on any page.</li>
          <li className="rounded-[1.25rem] bg-primary-foreground/10 p-4">
            Know somewhere we&apos;re missing?{" "}
            <Link href="/add-a-business" className="font-bold underline underline-offset-4">
              Add it
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
