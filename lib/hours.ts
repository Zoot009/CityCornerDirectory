// Opening hours as scraped ("10 am–2 pm, 5–9 pm", "6:30 AM–12 AM", "Open 24 hours", "Closed") and "open now" checks.
// ponytail: uses the visitor's clock, since the data has no time zones; store a zone per city to be exact for travellers.

const toMinutes = (time: string, meridiem: string) => {
  const [h, m = "0"] = time.split(":");
  return ((Number(h) % 12) + (meridiem === "pm" ? 12 : 0)) * 60 + Number(m);
};

const toClock = (minutes: number) => {
  const m = minutes % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}${m % 60 ? `:${String(m % 60).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};

// Minute ranges since midnight; an end past midnight goes beyond 1440. null = format not understood.
export function parseHours(text: string): [number, number][] | null {
  const s = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (s.includes("24 hours")) return [[0, 1440]];
  if (s.includes("closed")) return [];
  const ranges: [number, number][] = [];
  for (const part of s.split(",")) {
    const m = part.trim().match(/^(\d{1,2}(?::\d{2})?) ?(am|pm)? ?[–-] ?(\d{1,2}(?::\d{2})?) ?(am|pm)$/);
    if (!m) return null;
    const end = toMinutes(m[3], m[4]);
    // "5–9 pm": the start borrows the end's am/pm, unless that would put it after the end ("11–2 pm").
    let start = toMinutes(m[1], m[2] ?? m[4]);
    if (!m[2] && start > end) start = toMinutes(m[1], "am");
    ranges.push([start, end <= start ? end + 1440 : end]);
  }
  return ranges;
}

export const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// "Open · until 9 pm", "Closed · opens 5 pm", "Closed", or null when today's hours are unknown.
export function openStatus(hours: [day: string, hours: string][], now: Date): { open: boolean; detail: string } | null {
  const today = hours.find(([day]) => day === DAYS[now.getDay()]);
  const ranges = today && parseHours(today[1]);
  if (!ranges) return null;
  const minute = now.getHours() * 60 + now.getMinutes();
  const current = ranges.find(([a, b]) => minute >= a && minute < b);
  if (current) return { open: true, detail: current[1] - current[0] >= 1440 ? "24 hours" : `until ${toClock(current[1])}` };
  const next = ranges.find(([a]) => a > minute);
  return { open: false, detail: next ? `opens ${toClock(next[0])}` : "" };
}
