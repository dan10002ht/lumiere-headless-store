import ProductGrid from "@/components/product/product-grid";
import { FadeIn } from "@/components/motion/motion-wrapper";
import { getProducts } from "@/lib/shopify";

export const metadata = {
  title: "Shop All | LUMIERE",
  description:
    "Browse our full collection of handcrafted soy candles and home fragrances.",
};

export default async function ProductsPage() {
  let products = [];

  try {
    const data = await getProducts({ first: 24 });
    products = data.products;
  } catch (e) {
    console.error("Failed to fetch products:", e);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Our Collection
          </p>
          <h1 className="font-serif text-4xl font-light tracking-wide lg:text-5xl">
            All Products
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {products.length} handcrafted candles and home fragrances.
          </p>
          <div className="mt-6 h-px w-16 bg-warm/50" />
        </div>
      </FadeIn>

      <ProductGrid products={products} />
    </div>
  );
}
