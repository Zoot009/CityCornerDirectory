import { Heart } from "lucide-react";
import Link from "next/link";
import { FormShell } from "@/components/cards";
import { ActionForm, SelectField, TextArea, TextField } from "@/components/forms";
import { submitBusiness } from "@/lib/actions";
import { getCities, getGroups } from "@/lib/data";
import { pageMeta, SITE_NAME } from "@/lib/site";

export const metadata = pageMeta({
  title: "Add a business",
  description: `Add a local place to ${SITE_NAME} for free. Owners, staff and regulars are all welcome to suggest one.`,
  path: "/add-a-business",
  noindex: true,
});

const perks = ["Free, with nothing to upgrade", "A link to your website", "Ranked on reviews, never on money", "Replies to reviews once claimed"];

export default async function AddBusinessPage() {
  const [groups, cities] = await Promise.all([getGroups(), getCities()]);
  return (
    <FormShell
      tone="bg-butter"
      kicker="Free to list"
      title="Add a business"
      intro={
        <>
          <p>
            Know a corner we&apos;re missing? Tell us about it. Already listed?{" "}
            <Link href="/claim" className="link">
              Claim it instead
            </Link>
            .
          </p>
          <ul className="grid gap-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 rounded-[1.1rem] bg-card/70 px-4 py-2.5 text-sm font-bold text-foreground">
                <Heart className="size-4 shrink-0 fill-primary stroke-none" /> {p}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <ActionForm action={submitBusiness} submitLabel="Add this business" done={{ href: "/", label: "Back home" }}>
        <TextField name="businessName" label="Name of the place" maxLength={120} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField name="category" label="What kind of place?">
            {groups.map((g) => (
              <optgroup key={g.slug} label={g.name}>
                {g.categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.singular}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
          <TextField name="city" label="City" maxLength={120} autoComplete="off" list="city-options" placeholder="Start typing…" />
          <datalist id="city-options">
            {cities.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
        </div>
        <TextField name="address" label="Street address" maxLength={300} hint="Include the neighbourhood and postcode" autoComplete="street-address" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="phone" label="Phone" type="tel" optional />
          <TextField name="website" label="Website" type="url" optional placeholder="https://" />
        </div>
        <TextArea name="description" label="In a sentence or two" optional maxLength={750} rows={3} placeholder="What do they do?" />
        <fieldset className="space-y-5 rounded-[1.5rem] bg-cloud p-5">
          <legend className="sr-only">About you</legend>
          <p className="font-display text-xl font-extrabold tracking-tight">And you are…</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Your name" autoComplete="name" />
            <TextField name="email" label="Your email" type="email" autoComplete="email" hint="Only to ask about this place" />
          </div>
          <SelectField name="relationship" label="Your connection to the place">
            <option value="owner">I own it</option>
            <option value="employee">I work there</option>
            <option value="customer">I&apos;m a regular</option>
          </SelectField>
        </fieldset>
      </ActionForm>
    </FormShell>
  );
}
