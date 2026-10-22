export { cn } from "cn"
import { cn } from "cn"

export const inputClass =
  "w-full rounded-[1.25rem] border-2 border-transparent bg-tint px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-card aria-invalid:border-destructive"

// Rounded chip link; `active` fills it with mocha.
export const pill = (active = false) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-tint text-foreground hover:bg-butter",
  )

// Category links in menus and bubbles open search, which covers every city.
export const categoryHref = (name: string) => `/search?q=${encodeURIComponent(name)}`
