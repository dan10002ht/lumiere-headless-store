"use client";

import { useEffect, useRef } from "react";
import { PortalSDK } from "joy-subscription-sdk/portal";
import { SCRIPTS } from "joy-subscription-sdk/core";
import useCartStore from "@/store/cart-store";
import { reloadScript, removeScript } from "@/lib/sdk-script-loader";

const sdkConfig = {
  shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  storefrontAccessToken:
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
};

export default function CustomerPortalClient() {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = new PortalSDK(sdkConfig);
    sdkRef.current = sdk;

    // Handle "Add new subscription" from portal
    const unsubscribe = sdk.on("add-to-cart", async (data) => {
      const { addItem, openCart } = useCartStore.getState();
      for (const line of data.lines) {
        await addItem(line.merchandiseId, line.quantity, line.sellingPlanId);
      }
      openCart();
    });

    sdk
      .initCustomerPortal({ autoLoadScript: false })
      .then(() => reloadScript(SCRIPTS.CUSTOMER_PORTAL));

    return () => {
      unsubscribe();
      sdk.destroyCustomerPortal();
      removeScript(SCRIPTS.CUSTOMER_PORTAL);
    };
  }, []);

  return <div id="Avada-SubscriptionManagement__Container" />;
}
