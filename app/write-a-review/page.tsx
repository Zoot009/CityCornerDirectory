import Link from "next/link";
import { BusinessPicker, firstParam, SelectedBusiness } from "@/components/business-picker";
import { FormShell } from "@/components/cards";
import { ActionForm, StarPicker, TextArea, TextField } from "@/components/forms";
import { submitReview } from "@/lib/actions";
import { businessPath, getBusiness } from "@/lib/data";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Write a review",
  description: "Tell others about a local place you've been to.",
  path: "/write-a-review",
  noindex: true,
});

const PATH = "/write-a-review";

export default async function WriteReviewPage({ searchParams }: PageProps<"/write-a-review">) {
  const sp = await searchParams;
  const business = (await getBusiness(firstParam(sp.biz)))?.business;

  return (
    <FormShell
      tone="bg-peach"
      kicker={business ? "Step 2 of 2" : "Step 1 of 2"}
      title={business ? "Share your experience" : "Which place did you visit?"}
      intro={
        business ? (
          <p>
            Honest and specific helps most. Our{" "}
            <Link href="/about#guidelines" className="link">
              review rules
            </Link>{" "}
            are short.
          </p>
        ) : (
          <p>Find it by name and city, then tell the neighbourhood how it went.</p>
        )
      }
    >
      {business ? (
        <>
          <SelectedBusiness business={business} path={PATH} />
          <div className="mt-3">
            <ActionForm action={submitReview} submitLabel="Publish my review" done={{ href: businessPath(business), label: `Back to ${business.name}` }}>
              <input type="hidden" name="biz" value={business.slug} />
              <StarPicker />
              <TextArea name="text" label="Your review" minLength={50} maxLength={5000} rows={6} placeholder="What did you go for? How was it? Would you go back?" />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="name" label="Your name" autoComplete="name" hint="We show your first name and initial" />
                <TextField name="email" label="Email" type="email" autoComplete="email" hint="Private, never shown" />
              </div>
            </ActionForm>
          </div>
        </>
      ) : (
        <BusinessPicker q={firstParam(sp.q)} path={PATH} cta="Review" />
      )}
    </FormShell>
  );
}
