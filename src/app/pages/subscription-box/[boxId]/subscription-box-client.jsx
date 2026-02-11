"use client";

import { useEffect, useRef } from "react";
import { BoxSDK } from "joy-subscription-sdk/box";
import useCartStore from "@/store/cart-store";
import { cartDiscountCodesUpdate } from "@/lib/shopify";

export default function SubscriptionBoxClient({ boxId }) {
  const sdkRef = useRef(null);
  const { addItem, cart, openCart } = useCartStore();

  useEffect(() => {
    const sdk = new BoxSDK();
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
