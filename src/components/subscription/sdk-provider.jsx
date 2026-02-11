"use client";

import { SubscriptionSDK } from "joy-subscription-sdk";

let configured = false;

function ensureConfigured() {
  if (!configured && typeof window !== "undefined") {
    SubscriptionSDK.configure({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
      storefrontAccessToken:
        process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    });
    configured = true;
  }
}

export default function SubscriptionSDKProvider({ children }) {
  ensureConfigured();
  return children;
}
