import { House } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";

type Crumb = { name: string; href: string };

// Visible trail plus BreadcrumbList structured data. "Home" is added automatically.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-semibold">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden className="text-muted-foreground">
                /
              </span>
            )}
            {i === all.length - 1 ? (
              <span aria-current="page" className="rounded-full bg-butter px-3 py-1">
                {c.name}
              </span>
            ) : (
              <Link href={c.href} className="link flex items-center gap-1">
                {i === 0 && <House aria-hidden className="size-3.5" />}
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
        }}
      />
    </nav>
  );
}
