import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/motion-wrapper";
import ProductCard from "./product-card";

export default function ProductGrid({ products }) {
  if (!products || products.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No products found.
      </p>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
