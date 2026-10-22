import { BusinessPicker, firstParam, SelectedBusiness } from "@/components/business-picker";
import { FormShell } from "@/components/cards";
import { ActionForm, SelectField, TextArea, TextField } from "@/components/forms";
import { submitEdit } from "@/lib/actions";
import { businessPath, getBusiness } from "@/lib/data";
import { EDIT_ISSUES, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Fix a listing",
  description: "Let us know when a page is out of date.",
  path: "/suggest-an-edit",
  noindex: true,
});

const PATH = "/suggest-an-edit";

export default async function SuggestEditPage({ searchParams }: PageProps<"/suggest-an-edit">) {
  const sp = await searchParams;
  const business = (await getBusiness(firstParam(sp.biz)))?.business;

  return (
    <FormShell
      tone="bg-cloud"
      kicker="Fix a listing"
      title="Spotted a mistake?"
      intro={<p>Thanks for keeping every corner accurate. We check each suggestion before anything changes.</p>}
    >
      {business ? (
        <>
          <SelectedBusiness business={business} path={PATH} />
          <div className="mt-3">
            <ActionForm action={submitEdit} submitLabel="Send the fix" done={{ href: businessPath(business), label: `Back to ${business.name}` }}>
              <input type="hidden" name="biz" value={business.slug} />
              <SelectField name="issue" label="What's wrong?">
                {Object.entries(EDIT_ISSUES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <TextArea name="details" label="What should it say?" minLength={10} maxLength={2000} rows={4} placeholder="The right phone number, hours or address" />
              <TextField name="email" label="Your email" type="email" optional autoComplete="email" hint="Only if you'd like to hear back" />
            </ActionForm>
          </div>
        </>
      ) : (
        <BusinessPicker q={firstParam(sp.q)} path={PATH} cta="Fix this" />
      )}
    </FormShell>
  );
}
