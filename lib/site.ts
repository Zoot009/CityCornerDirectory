import type { Metadata } from "next";
import { env } from "@/lib/env";

export const SITE_NAME = "CityCornerDirectory";
export const SITE_DOMAIN = "citycornerdirectory.com"; // sites.domain in the shared database; tags form submissions
export const CONTACT_EMAIL = "hello@citycornerdirectory.com"; // ponytail: placeholder, set the real inbox before launch

// Cities that lead the home page and every city list, in this order (slugs from the cities table).
// Empty until this site's data is added: cities then go by how many listings they have.
export const FEATURED_CITIES: string[] = [];

export const absoluteUrl = (path: string) => new URL(path, env.SITE_URL).href;

// Every page sets its own title, description and canonical. Search and form pages pass noindex.
export function pageMeta({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website" },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

// Choices on the "Suggest an edit" form.
export const EDIT_ISSUES = {
  closed: "It has closed permanently",
  address: "The address or pin is in the wrong place",
  phone: "The phone number doesn't work",
  hours: "The opening hours are wrong or missing",
  website: "The website link is wrong or missing",
  category: "It's in the wrong category",
  other: "Something else needs fixing",
} as const;
