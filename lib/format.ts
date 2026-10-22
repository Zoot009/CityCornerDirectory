export const formatCount = (n: number) => n.toLocaleString("en");

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

// "online_appointments" -> "Online appointments"
const labels: Record<string, string> = { dine_in: "Dine-in", takeout: "Takeaway", onsite_services: "On-site services" };
export const humanise = (key: string) => labels[key] ?? (key.charAt(0).toUpperCase() + key.slice(1)).replace(/_/g, " ");

export const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

// "Dentists in Mumbai" style list: "A, B and C"
export function joinList(items: string[]) {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
