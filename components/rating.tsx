import { Star } from "lucide-react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

const row = (className: string) =>
  [1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("shrink-0 fill-current stroke-none", className)} />);

// Five stars filled to the exact value, in honey.
export function Stars({ value, className = "size-5" }: { value: number; className?: string }) {
  const width = `${(Math.min(5, Math.max(0, value)) / 5) * 100}%`;
  return (
    <span aria-hidden className="relative inline-flex shrink-0 text-current/20">
      {row(className)}
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-500" style={{ width }}>
        {row(className)}
      </span>
    </span>
  );
}

// "★ 4.8 · 1,203 reviews": a butter chip plus the count.
export function RatingPill({ rating, count, onDark, className }: { rating: number | null; count: number; onDark?: boolean; className?: string }) {
  if (rating === null) {
    return <span className={cn("inline-flex rounded-full bg-cloud px-2.5 py-0.5 text-xs font-bold text-foreground", className)}>New here</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-0.5 font-display font-extrabold text-foreground">
        <Star className="size-3.5 fill-amber-500 stroke-none" />
        {rating.toFixed(1)}
      </span>
      {count > 0 && <span className={onDark ? "text-primary-foreground/80" : "text-muted-foreground"}>{formatCount(count)} reviews</span>}
    </span>
  );
}
