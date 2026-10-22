import { z } from "zod";

export const env = z
  .object({
    SITE_URL: z.url().default("http://localhost:3000"), // canonical URLs, sitemap and JSON-LD
    WEB_DATABASE_URL: z.url().optional(), // read-only directory login; lib/db.ts requires it when it runs a query
    WRITE_DATABASE_URL: z.url().optional(), // form inbox login (submissions, listing_requests); required when a form is sent
  })
  .parse(process.env);
