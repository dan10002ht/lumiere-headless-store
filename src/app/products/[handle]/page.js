import { notFound } from "next/navigation";
import ProductGallery from "@/components/product/product-gallery";
import ProductInfo from "@/components/product/product-info";
import ProductGrid from "@/components/product/product-grid";
import Breadcrumb from "@/components/ui/breadcrumb";
import { FadeIn } from "@/components/motion/motion-wrapper";
import { getProductByHandle, getProducts } from "@/lib/shopify";

export async function generateMetadata({ params }) {
  const { handle } = await params;
  try {
    const product = await getProductByHandle(handle);
    if (!product) return { title: "Product Not Found | LUMIERE" };
    return {
      title: `${product.title} | LUMIERE`,
      description: product.description?.slice(0, 160),
    };
  } catch {
    return { title: "Product Not Found | LUMIERE" };
  }
}

export default async function ProductPage({ params }) {
  const { handle } = await params;
  let product;

  try {
    product = await getProductByHandle(handle);
  } catch (e) {
    console.error("Failed to fetch product:", e);
  }

  if (!product) notFound();

  let relatedProducts = [];
  try {
    const data = await getProducts({ first: 5 });
    relatedProducts = data.products.filter((p) => p.handle !== handle);
  } catch (e) {
    console.error("Failed to fetch related products:", e);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <FadeIn direction="left">
          <ProductGallery images={product.images} />
        </FadeIn>
        <FadeIn direction="right" delay={0.1}>
          <ProductInfo product={product} />
        </FadeIn>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <FadeIn>
          <div className="mt-24">
            <h2 className="mb-2 font-serif text-2xl font-light tracking-wide">
              You May Also Like
            </h2>
            <div className="mb-10 h-px w-12 bg-warm/50" />
            <ProductGrid products={relatedProducts.slice(0, 4)} />
          </div>
        </FadeIn>
      )}
    </div>
  );
}
