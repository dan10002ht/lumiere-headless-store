"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/shopify";
import useCartStore from "@/store/cart-store";

export default function ProductCard({ product }) {
  const image = product.images.edges[0]?.node;
  const secondImage = product.images.edges[1]?.node;
  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice;
  const hasDiscount =
    compareAtPrice &&
    parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
  const discountPercent = hasDiscount
    ? Math.round(
        (1 - parseFloat(price.amount) / parseFloat(compareAtPrice.amount)) * 100
      )
    : 0;

  const firstVariantId = product.variants.edges[0]?.node?.id;
  const { addItem } = useCartStore();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstVariantId) addItem(firstVariantId);
  };

  return (
    <Link href={`/products/${product.handle}`} className="group">
      <div
        className="relative aspect-square overflow-hidden rounded bg-muted transition-shadow duration-300"
        style={{
          boxShadow: "var(--shadow-card)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = "var(--shadow-card)")
        }
      >
        {image ? (
          <>
            <Image
              src={image.url}
              alt={image.altText || product.title}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
            {secondImage && (
              <Image
                src={secondImage.url}
                alt={secondImage.altText || product.title}
                fill
                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {/* Sale badge */}
        {hasDiscount && (
          <Badge className="absolute left-3 top-3 border-0 bg-warm text-[10px] tracking-wider text-white">
            -{discountPercent}%
          </Badge>
        )}

        {/* Quick add overlay */}
        {firstVariantId && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded bg-background/90 py-2.5 text-xs font-medium uppercase tracking-wider opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-background group-hover:opacity-100"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Quick Add
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-serif text-sm font-medium leading-tight tracking-wide transition-colors duration-300 group-hover:text-warm">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
