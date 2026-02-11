"use client";

import { useEffect } from "react";
import { SubscriptionSDK } from "joy-subscription-sdk";

let configured = false;

export default function SubscriptionSDKProvider({ children }) {
  useEffect(() => {
    if (!configured) {
      SubscriptionSDK.configure({
        shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
        storefrontAccessToken:
          process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      });
      configured = true;
    }
  }, []);

  return children;
}
