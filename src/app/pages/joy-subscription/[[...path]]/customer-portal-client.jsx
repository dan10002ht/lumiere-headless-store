"use client";

import { useEffect, useRef } from "react";
import { PortalSDK } from "joy-subscription-sdk/portal";
import useCartStore from "@/store/cart-store";

export default function CustomerPortalClient() {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = new PortalSDK();
    sdkRef.current = sdk;

    // Handle "Add new subscription" from portal
    const unsubscribe = sdk.on("add-to-cart", async (data) => {
      const { addItem, openCart } = useCartStore.getState();
      for (const line of data.lines) {
        await addItem(line.merchandiseId, line.quantity, line.sellingPlanId);
      }
      openCart();
    });

    sdk.initCustomerPortal();

    return () => {
      unsubscribe();
      sdk.destroyCustomerPortal();
    };
  }, []);

  return <div id="Avada-SubscriptionManagement__Container" />;
}
