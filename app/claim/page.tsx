import { BusinessPicker, firstParam, SelectedBusiness } from "@/components/business-picker";
import { FormShell } from "@/components/cards";
import { ActionForm, CheckboxField, SelectField, TextArea, TextField } from "@/components/forms";
import { submitClaim } from "@/lib/actions";
import { businessPath, getBusiness } from "@/lib/data";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Claim your page",
  description: "Claim your free page to update your details and reply to reviews.",
  path: "/claim",
  noindex: true,
});

const PATH = "/claim";

export default async function ClaimPage({ searchParams }: PageProps<"/claim">) {
  const sp = await searchParams;
  const business = (await getBusiness(firstParam(sp.biz)))?.business;

  return (
    <FormShell
      tone="bg-matcha"
      kicker="Free forever"
      title={business ? "Tell us who you are" : "Find your business"}
      intro={<p>Once it&apos;s yours you can keep the details right, link to your website and answer reviews. Claiming costs nothing.</p>}
    >
      {business ? (
        <>
          <SelectedBusiness business={business} path={PATH} />
          <div className="mt-3">
            <ActionForm action={submitClaim} submitLabel="Send my claim" done={{ href: businessPath(business), label: `Back to ${business.name}` }}>
              <input type="hidden" name="biz" value={business.slug} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="name" label="Your name" autoComplete="name" />
                <SelectField name="role" label="You are the…">
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="agency">Agency working for them</option>
                </SelectField>
                <TextField name="email" label="Work email" type="email" autoComplete="email" hint="Ideally on the business's own domain" />
                <TextField name="phone" label="Phone" type="tel" autoComplete="tel" hint="We might ring to check" />
              </div>
              <TextArea name="notes" label="Anything that helps us check" optional maxLength={1000} rows={3} placeholder="For example, the landline we can call at the business" />
              <CheckboxField name="confirm" label="I'm allowed to manage this business's page." />
            </ActionForm>
          </div>
        </>
      ) : (
        <BusinessPicker q={firstParam(sp.q)} path={PATH} cta="This is mine" />
      )}
    </FormShell>
  );
}
