"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import { toneAt } from "@/components/thumb";
import { categoryHref, cn } from "@/lib/utils";

export type MenuGroup = { name: string; slug: string; icon: string; categories: { slug: string; name: string }[] };
type NavLink = { href: string; label: string };

// Closes on Escape or a click outside `ref` while open.
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open, close]);
  return ref;
}

// Pastel highlighter stroke under the current (and hovered) link.
const navItem =
  "relative isolate rounded-full px-4 py-2 font-bold whitespace-nowrap after:absolute after:inset-x-3 after:bottom-2 after:-z-10 after:h-2.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-peach after:transition-transform hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-expanded:after:scale-x-100";

// Centred desktop nav: the category menu plus the main links.
export function MainNav({ links, groups }: { links: NavLink[]; groups: MenuGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      <ExploreMenu groups={groups} />
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href || pathname.startsWith(`${l.href}/`) ? "page" : undefined} className={navItem}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

// "Explore" button opening a mocha panel of pastel group tiles.
function ExploreMenu({ groups }: { groups: MenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-controls="explore-panel" onClick={() => setOpen(!open)} className={cn(navItem, "flex items-center gap-1")}>
        Explore <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id="explore-panel" className="absolute top-full left-0 z-50 mt-3 grid w-[46rem] grid-cols-3 gap-2 rounded-[2rem] bg-primary p-3">
          {groups.slice(0, 9).map((g, i) => (
            <div key={g.slug} className={cn("rounded-[1.4rem] p-4", toneAt(i))}>
              <Link href={`/categories#${g.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 font-display font-extrabold hover:underline">
                <CategoryIcon name={g.icon} className="size-4" /> {g.name}
              </Link>
              <ul className="mt-1.5 space-y-0.5 text-sm">
                {g.categories.slice(0, 4).map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryHref(c.name)} onClick={() => setOpen(false)} className="block py-0.5 underline-offset-4 hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href="/categories"
            onClick={() => setOpen(false)}
            className="col-span-3 rounded-full bg-primary-foreground py-2.5 text-center text-sm font-bold text-primary hover:bg-butter"
          >
            See every category
          </Link>
        </div>
      )}
    </div>
  );
}

// Small screens: a mocha sheet with the main links, cities and pastel category tiles.
export function MobileMenu({ links, cities, groups }: { links: NavLink[]; cities: NavLink[]; groups: MenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="flex size-11 items-center justify-center rounded-full bg-tint"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      <div id="mobile-menu" hidden={!open} className="fixed inset-x-3 top-20 bottom-3 z-50 overflow-y-auto rounded-[2rem] bg-primary p-4 text-primary-foreground">
        <ul className="grid gap-1.5 font-bold">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={close} className="block rounded-[1.1rem] bg-primary-foreground/10 px-4 py-3 hover:bg-primary-foreground/20">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 px-2 font-display text-lg font-extrabold">Cities</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {cities.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={close} className="block rounded-full bg-butter px-3.5 py-1.5 text-sm font-bold text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 px-2 font-display text-lg font-extrabold">Categories</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {groups.map((g, i) => (
            <li key={g.slug}>
              <Link href={`/categories#${g.slug}`} onClick={close} className={cn("flex h-full items-center gap-2 rounded-[1.1rem] px-3 py-3 text-sm font-bold text-foreground", toneAt(i))}>
                <CategoryIcon name={g.icon} className="size-4 shrink-0" /> {g.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
