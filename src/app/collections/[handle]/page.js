import { notFound } from "next/navigation";
import ProductGrid from "@/components/product/product-grid";
import Breadcrumb from "@/components/ui/breadcrumb";
import { FadeIn } from "@/components/motion/motion-wrapper";
import { getCollectionByHandle } from "@/lib/shopify";

export async function generateMetadata({ params }) {
  const { handle } = await params;
  try {
    const collection = await getCollectionByHandle(handle);
    if (!collection) return { title: "Collection Not Found | LUMIERE" };
    return {
      title: `${collection.title} | LUMIERE`,
      description: collection.description?.slice(0, 160) || `Shop ${collection.title} collection.`,
    };
  } catch {
    return { title: "Collection Not Found | LUMIERE" };
  }
}

export default async function CollectionPage({ params }) {
  const { handle } = await params;
  let collection;

  try {
    collection = await getCollectionByHandle(handle);
  } catch (e) {
    console.error("Failed to fetch collection:", e);
  }

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection.title },
        ]}
      />

      <FadeIn>
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-light tracking-wide lg:text-5xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
          <div className="mt-6 h-px w-16 bg-warm/50" />
        </div>
      </FadeIn>

      <ProductGrid products={collection.products} />
    </div>
  );
}
