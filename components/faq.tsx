import { Plus } from "lucide-react";

export type FaqItem = { q: string; a: string };

// Native <details>: a cream tile per question that turns butter when open.
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((f) => (
        <details key={f.q} className="group rounded-[1.5rem] bg-card px-5 transition-colors open:bg-butter">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-bold tracking-tight">
            {f.q}
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-open:rotate-45">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="pb-5 leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
