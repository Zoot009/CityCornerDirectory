import { notFound } from "next/navigation";
import { ListingView, listingMeta } from "@/components/listing-view";
import { getListing } from "@/lib/data";

// ~22,000 lists: none at build, each rendered on its first visit and cached (see app/layout.tsx).
export const generateStaticParams = () => [];

async function load(params: PageProps<"/[city]/[category]">["params"]) {
  const { city, category } = await params;
  return (await getListing(city, category)) ?? notFound();
}

export async function generateMetadata({ params }: PageProps<"/[city]/[category]">) {
  return listingMeta(await load(params));
}

export default async function CategoryPage({ params }: PageProps<"/[city]/[category]">) {
  return <ListingView listing={await load(params)} />;
}
