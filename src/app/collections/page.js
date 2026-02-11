import CollectionCard from "@/components/collection/collection-card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/motion-wrapper";
import { getCollections } from "@/lib/shopify";

export const metadata = {
  title: "Collections | LUMIERE",
  description: "Explore our curated collections of handcrafted candles and home fragrances.",
};

export default async function CollectionsPage() {
  let collections = [];

  try {
    collections = await getCollections(20);
  } catch (e) {
    console.error("Failed to fetch collections:", e);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Curated For You
          </p>
          <h1 className="font-serif text-4xl font-light tracking-wide lg:text-5xl">
            Our Collections
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Explore scents curated for every mood and moment.
          </p>
          <div className="mt-6 h-px w-16 bg-warm/50" />
        </div>
      </FadeIn>

      {collections.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <StaggerItem key={collection.id}>
              <CollectionCard collection={collection} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          No collections found.
        </p>
      )}
    </div>
  );
}
