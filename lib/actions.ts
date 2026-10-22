"use server";

import { z } from "zod";
import { businessExists, findCity, getCategory, httpUrl } from "@/lib/data";
import { write } from "@/lib/db";
import { EDIT_ISSUES, SITE_DOMAIN } from "@/lib/site";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>; // echoed back so a failed submit keeps what the visitor typed
};

// Reviews, claims and edits go to the submissions inbox the sister sites share (pending until a moderator
// decides); approved reviews come back out through the approved_reviews view.
const inbox = (kind: "reviews" | "claims" | "edits") => (data: object) =>
  write("insert into submissions (kind, site, data) values ($1, $2, $3)", [kind, SITE_DOMAIN, data]);

async function handle<T>(schema: z.ZodType<T>, formData: FormData, success: string, save: (data: T) => Promise<void>): Promise<FormState> {
  const values = Object.fromEntries(
    [...formData].filter((e): e is [string, string] => typeof e[1] === "string" && !e[0].startsWith("$ACTION")),
  );
  // Spam trap: the "fax" field is hidden from people, so only bots fill it. Pretend it worked.
  if (values.fax) return { ok: true, message: success };
  const parsed = await schema.safeParseAsync(values);
  if (!parsed.success) {
    return { ok: false, message: "A couple of things need a look, see below.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  try {
    await save(parsed.data);
  } catch (e) {
    console.error("[forms] could not save", e);
    return { ok: false, message: "Oops, that didn't save. Please try again in a moment.", values };
  }
  return { ok: true, message: success };
}

const name = z.string().trim().min(2, "Enter your name").max(80);
const email = z.email("Enter a valid email address").max(120);
const business = z.string().max(300).refine(businessExists, "Choose a business first");
const phone = z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number");

// A form value resolved to its row id, or a field error when nothing matches.
const toId = (find: (value: string) => Promise<{ id: number } | undefined>, message: string) =>
  z.string().max(120).transform(async (value, ctx) => {
    const row = await find(value);
    if (!row) ctx.addIssue({ code: "custom", message });
    return row?.id ?? z.NEVER;
  });

const reviewSchema = z.object({
  biz: business,
  rating: z.coerce.number("Choose a star rating").int().min(1, "Choose a star rating").max(5, "Choose a star rating"),
  text: z.string().trim().min(50, "Please write at least 50 characters").max(5000, "Please keep it under 5,000 characters"),
  name,
  email,
});

const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the business name").max(120),
  category: toId(getCategory, "Choose a category"),
  city: toId(findCity, "Pick a city from the list"),
  address: z.string().trim().min(10, "Enter the full address").max(300),
  phone: phone.or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((s) => !s || httpUrl.safeParse(s).success, "Website must start with http:// or https://"),
  description: z.string().trim().max(750, "Please keep it under 750 characters"),
  name,
  email,
  relationship: z.enum(["owner", "employee", "customer"], "Tell us how you know this business"),
});

const claimSchema = z.object({
  biz: business,
  name,
  role: z.enum(["owner", "manager", "employee", "agency"], "Choose your role"),
  email,
  phone,
  notes: z.string().trim().max(1000),
  confirm: z.literal("on", "Please confirm you're authorised to manage this business"),
});

const editSchema = z.object({
  biz: business,
  issue: z.enum(Object.keys(EDIT_ISSUES) as [keyof typeof EDIT_ISSUES], "Choose what needs changing"),
  details: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
  email: email.or(z.literal("")),
});

export async function submitReview(_: FormState, formData: FormData) {
  return handle(
    reviewSchema,
    formData,
    "Thanks for sharing! Every review gets a quick check against our rules, then it goes live.",
    inbox("reviews"),
  );
}

// New places wait in listing_requests (status pending) until someone publishes them.
export async function submitBusiness(_: FormState, formData: FormData) {
  return handle(businessSchema, formData, "Got it! We'll look the place over and add it, usually within a few days.", (b) =>
    write(
      `insert into listing_requests
         (plan, name, category_id, city_id, address, phone, website, description, submitter_name, submitter_email, relation, site_domain)
       values ('free', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [b.businessName, b.category, b.city, b.address, b.phone || null, b.website || null, b.description || null, b.name, b.email, b.relationship, SITE_DOMAIN],
    ),
  );
}

export async function submitClaim(_: FormState, formData: FormData) {
  return handle(claimSchema, formData, "Claim received! Expect an email from us within two working days. It's free, always.", inbox("claims"));
}

export async function submitEdit(_: FormState, formData: FormData) {
  return handle(editSchema, formData, "Thank you! We'll check the details and update the page.", inbox("edits"));
}
