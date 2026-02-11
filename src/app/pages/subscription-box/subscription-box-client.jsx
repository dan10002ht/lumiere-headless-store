"use client";

import { useEffect, useRef } from "react";
import { BoxSDK } from "joy-subscription-sdk/box";
import useCartStore from "@/store/cart-store";
import { cartDiscountCodesUpdate } from "@/lib/shopify";

export default function SubscriptionBoxClient() {
  const sdkRef = useRef(null);
  const { addItem, cart, openCart } = useCartStore();

  useEffect(() => {
    const sdk = new BoxSDK({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
      storefrontAccessToken:
        process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    });
    sdkRef.current = sdk;

    const unsubscribe = sdk.on("add-to-cart", async (data) => {
      // Add all lines to cart
      for (const line of data.lines) {
        await addItem(line.merchandiseId, line.quantity, line.sellingPlanId);
      }

      // Apply discount codes if any
      if (data.discountCodes?.length > 0 && cart?.id) {
        await cartDiscountCodesUpdate(cart.id, data.discountCodes);
      }

      openCart();
    });

    sdk.initSubscriptionBox();

    return () => {
      unsubscribe();
      sdk.destroySubscriptionBox();
    };
  }, []);

  return <div className="Avada-SubscriptionBox__Wrapper" />;
}
