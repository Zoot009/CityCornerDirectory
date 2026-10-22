import { cn } from "@/lib/utils";

// The pastel tiles, as full class names so Tailwind sees them. Mocha text reads on every one.
export const tones = ["bg-butter", "bg-matcha", "bg-peach", "bg-cloud", "bg-clay"] as const;

// Tile colour for a list position: neighbours never share a colour.
export const toneAt = (i: number) => tones[i % tones.length];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Same name, same colour, on every page.
export const toneFor = (name: string) => toneAt([...name].reduce((sum, c) => sum + c.charCodeAt(0), 0));

// A business photo, or a pastel tile with its initials. `src` is already http(s)-only (lib/data.ts).
export function Thumb({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- scraped hosts are unknown, so next/image can't allowlist them
    return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={cn("shrink-0 object-cover", className)} />;
  }
  return (
    <div aria-hidden className={cn("flex shrink-0 items-center justify-center font-display font-extrabold tracking-tight text-foreground", toneFor(name), className)}>
      {initials(name)}
    </div>
  );
}
