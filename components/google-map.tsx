import { cn } from "@/lib/utils";

type Point = { lat: number; lng: number };

// Google Maps' keyless embed: one place found by name and address, or a view of an area.
// It can't draw our own pins; that needs the Maps JavaScript API and a key.
export function GoogleMap({
  place,
  area,
  title,
  className,
}: {
  place?: string; // "Business name, full address"
  area?: { center: Point; zoom: number };
  title: string;
  className?: string;
}) {
  const params = new URLSearchParams(
    place
      ? { q: place, z: "16", hl: "en", output: "embed" }
      : { ll: `${area!.center.lat},${area!.center.lng}`, z: String(area!.zoom), hl: "en", output: "embed" },
  );
  return (
    <iframe
      src={`https://maps.google.com/maps?${params}`}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className={cn("w-full border-0 bg-muted", className)}
    />
  );
}

// Centre and zoom that frame these points, or null when there are none or they're too far apart to be one area.
export function areaView(points: Point[]) {
  if (!points.length) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs), 0.005);
  const zoom = Math.min(16, Math.floor(Math.log2(540 / span))); // ~2 map tiles wide
  if (zoom < 9) return null;
  return {
    center: { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 },
    zoom,
  };
}
