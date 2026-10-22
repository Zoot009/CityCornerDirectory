import { notFound } from "next/navigation";
import { ListingView, listingMeta } from "@/components/listing-view";
import { getListing } from "@/lib/data";

// Rendered on first visit and cached, like the city+category lists.
export const generateStaticParams = () => [];

async function load(params: PageProps<"/[city]/[category]/[area]">["params"]) {
  const { city, category, area } = await params;
  return (await getListing(city, category, area)) ?? notFound();
}

export async function generateMetadata({ params }: PageProps<"/[city]/[category]/[area]">) {
  return listingMeta(await load(params));
}

export default async function AreaPage({ params }: PageProps<"/[city]/[category]/[area]">) {
  return <ListingView listing={await load(params)} />;
}
