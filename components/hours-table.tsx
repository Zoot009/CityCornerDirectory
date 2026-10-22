"use client";

import { useSyncExternalStore } from "react";
import { DAYS } from "@/lib/hours";
import { cn } from "@/lib/utils";

const noop = () => () => {};

// One row per day on the hours tile; today turns mocha once the browser knows what day it is.
export function HoursTable({ hours }: { hours: [day: string, hours: string][] }) {
  const today = useSyncExternalStore(noop, () => DAYS[new Date().getDay()], () => null);
  return (
    <ul className="space-y-1 text-sm">
      {hours.map(([day, time]) => {
        const isToday = day === today;
        return (
          <li
            key={day}
            aria-current={isToday ? "date" : undefined}
            className={cn("flex items-center justify-between gap-3 rounded-[0.9rem] px-3.5 py-2", isToday ? "bg-primary font-bold text-primary-foreground" : "bg-card/60")}
          >
            <span className="capitalize">
              {day.slice(0, 3)}
              <span className="sr-only">{day.slice(3)}</span>
              {isToday && " · today"}
            </span>
            <span className={cn("text-right", !isToday && /closed/i.test(time) && "text-muted-foreground")}>{time}</span>
          </li>
        );
      })}
    </ul>
  );
}
