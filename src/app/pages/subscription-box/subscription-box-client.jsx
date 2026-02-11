"use client";

import { useEffect, useRef } from "react";
import { BoxSDK } from "joy-subscription-sdk/box";
import useCartStore from "@/store/cart-store";
import { cartDiscountCodesUpdate } from "@/lib/shopify";

export default function SubscriptionBoxClient() {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = new BoxSDK();
    sdkRef.current = sdk;

    const unsubscribe = sdk.on("add-to-cart", async (data) => {
      const { addItem, cart, openCart } = useCartStore.getState();

      for (const line of data.lines) {
        await addItem(line.merchandiseId, line.quantity, line.sellingPlanId);
      }

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
