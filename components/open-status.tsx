"use client";

import { useSyncExternalStore } from "react";
import { openStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

const everyMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};

// Pages are prerendered, so this fills in after hydration and refreshes each minute.
export function OpenStatus({ hours, onDark, className }: { hours: [day: string, hours: string][]; onDark?: boolean; className?: string }) {
  const json = useSyncExternalStore(everyMinute, () => JSON.stringify(openStatus(hours, new Date())), () => "null");
  const status: ReturnType<typeof openStatus> = JSON.parse(json);
  if (!status) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", status.open ? "bg-emerald-400" : "bg-rose-400")} />
      <span className={cn("font-medium", status.open ? (onDark ? "text-emerald-300" : "text-emerald-700") : onDark ? "text-rose-300" : "text-rose-700")}>
        {status.open ? "Open" : "Closed"}
      </span>
      {status.detail && <span className="opacity-75">· {status.detail}</span>}
    </span>
  );
}
