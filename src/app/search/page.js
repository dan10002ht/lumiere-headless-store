import ProductGrid from "@/components/product/product-grid";
import { FadeIn } from "@/components/motion/motion-wrapper";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchProducts } from "@/lib/shopify";

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q} | LUMIERE` : "Search | LUMIERE",
  };
}

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  let products = [];

  if (q) {
    try {
      products = await searchProducts(q);
    } catch (e) {
      console.error("Failed to search products:", e);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Find Your Scent
          </p>
          <h1 className="font-serif text-4xl font-light tracking-wide lg:text-5xl">
            Search
          </h1>
          <div className="mt-6 h-px w-16 bg-warm/50" />
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form action="/search" className="mb-12">
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search candles, scents, collections..."
              defaultValue={q || ""}
              className="h-12 pl-11 pr-4 text-sm tracking-wide"
            />
          </div>
        </form>
      </FadeIn>

      {q ? (
        <>
          <FadeIn delay={0.15}>
            <p className="mb-8 text-sm text-muted-foreground">
              {products.length} result{products.length !== 1 ? "s" : ""} for
              &ldquo;{q}&rdquo;
            </p>
          </FadeIn>

          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <FadeIn delay={0.2}>
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="mt-4 font-serif text-lg font-light">
                  No results found
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Try adjusting your search or explore our collections for inspiration.
                </p>
              </div>
            </FadeIn>
          )}
        </>
      ) : (
        <FadeIn delay={0.2}>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Search className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="mt-4 font-serif text-lg font-light">
              Discover something new
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Enter a search term to find candles, scents, and more.
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
