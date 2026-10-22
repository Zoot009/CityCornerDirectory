import { Ban, Globe, MessageCircleReply, PencilLine, Scale, Search, Sparkles } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { Kicker, SampleListing, Section } from "@/components/cards";
import { Faq } from "@/components/faq";
import { toneAt } from "@/components/thumb";
import { pageMeta, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata = pageMeta({
  title: "For businesses: your free page",
  description: `Claim or add your business on ${SITE_NAME} for free. Keep your details right, answer reviews and link to your website. Nothing to pay, no paid rankings.`,
  path: "/for-businesses",
});

const perks = [
  { icon: Sparkles, title: "Free. Really.", text: "No plans, no upsells, no trial that ends. Every business gets everything." },
  { icon: Scale, title: "A fair spot", text: "Order comes from ratings and review counts only. Nobody can buy their way up." },
  { icon: Globe, title: "Your website, linked", text: "Your page sends people straight to your own site." },
  { icon: PencilLine, title: "Always up to date", text: "Change your phone number, hours or address whenever you need to." },
  { icon: MessageCircleReply, title: "Talk back", text: "Thank people for kind words and answer complaints in public." },
  { icon: Ban, title: "No competitor ads", text: "We don't sell ads, so nobody else's offer shows up on your page." },
];

const faqs = [
  { q: "Is it actually free?", a: `Yes. ${SITE_NAME} has no paid plans, sponsored spots or ads. Claiming and editing your page costs nothing.` },
  { q: "Can I pay to show up higher?", a: "No. The order comes from ratings weighted by how many people left one. There's nothing to buy." },
  { q: "How quickly do you check claims?", a: "Usually within two working days. We may email you or call the number on your page." },
  { q: "Can you delete a bad review?", a: "Only if it breaks our review rules, for example if it's fake or abusive. You can always reply publicly." },
  { q: "We're not listed. What now?", a: "Use Add a business. Owners, staff and regulars can all suggest one." },
];

export default function ForBusinessesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 pt-3">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-[2.25rem] bg-butter p-6 sm:p-12">
          <Kicker>{SITE_NAME} for business</Kicker>
          <h1 className="mt-4 text-5xl leading-[0.95] text-balance sm:text-7xl">Your corner is waiting, and it&apos;s free</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">Claim your page to keep your details right, reply to reviews and send people to your website.</p>
          <Form action="/claim" className="mt-8 flex max-w-xl gap-2 rounded-[1.6rem] bg-card p-2">
            <label htmlFor="claim-q" className="sr-only">
              Your business name
            </label>
            <input
              id="claim-q"
              name="q"
              placeholder="Search your business name"
              className="w-full min-w-0 rounded-[1.1rem] bg-tint px-4 font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button type="submit" className="flex shrink-0 items-center gap-2 rounded-[1.1rem] bg-primary px-5 py-3.5 font-bold text-primary-foreground hover:bg-primary-dark">
              <Search className="size-4" /> <span className="max-sm:sr-only">Find it</span>
            </button>
          </Form>
          <p className="mt-4 text-sm">
            Not on {SITE_NAME} yet?{" "}
            <Link href="/add-a-business" className="link">
              Add your business
            </Link>
          </p>
        </div>
        <div className="flex items-center rounded-[2.25rem] bg-primary px-5 py-12 sm:px-10">
          <SampleListing />
        </div>
      </section>

      <Section title="What you get" kicker="All included" id="perks">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((p, i) => (
            <li key={p.title} className={cn("flex min-h-52 flex-col justify-between gap-6 rounded-[1.75rem] p-6", toneAt(i))}>
              <span className="flex size-12 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
                <p.icon className="size-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-extrabold tracking-tight">{p.title}</p>
                <p className="mt-1.5 text-muted-foreground">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Claiming takes three steps" kicker="How it works" id="steps">
        <ol className="grid gap-3 md:grid-cols-3">
          {["Find your business above", "We check it's really yours", "Keep it fresh and reply to reviews"].map((t, i) => (
            <li key={t} className="flex items-center gap-4 rounded-[1.75rem] bg-card p-4 pr-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-primary font-display text-2xl font-extrabold text-primary-foreground">{i + 1}</span>
              <span className="font-display text-lg font-bold tracking-tight">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      <div className="rounded-[2.25rem] bg-tint p-5 sm:p-10">
        <Section title="Questions owners ask" kicker="FAQ" id="faq" className="max-w-3xl">
          <Faq items={faqs} />
        </Section>
      </div>
    </div>
  );
}
