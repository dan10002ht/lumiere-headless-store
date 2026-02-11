"use client";

import { useEffect, useRef } from "react";
import { ProductBundleSDK } from "joy-subscription-sdk/productBundle";
import useCartStore from "@/store/cart-store";
import { cartDiscountCodesUpdate } from "@/lib/shopify";

const sdkConfig = {
  shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  storefrontAccessToken:
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
};

export default function ProductBundleWidget({ productHandle }) {
  const sdkRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    const sdk = new ProductBundleSDK(sdkConfig);
    sdkRef.current = sdk;

    unsubRef.current = sdk.on("add-to-cart", async (data) => {
      const { addItem, cart, openCart } = useCartStore.getState();

      for (const line of data.lines) {
        await addItem(line.merchandiseId, line.quantity, line.sellingPlanId);
      }

      if (data.discountCodes?.length > 0 && cart?.id) {
        await cartDiscountCodesUpdate(cart.id, data.discountCodes);
      }

      openCart();
    });

    sdk.initProductBundle(productHandle);

    return () => {
      unsubRef.current?.();
      sdk.destroy();
    };
  }, [productHandle]);

  return (
    <div
      className="Avada-ProductBundleData-Block"
      data-product={JSON.stringify({ handle: productHandle })}
    />
  );
}
