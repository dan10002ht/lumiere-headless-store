"use client";

import { useEffect, useRef } from "react";
import { WidgetSDK } from "joy-subscription-sdk/widget";

const sdkConfig = {
  shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  storefrontAccessToken:
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
};

export default function SubscriptionWidget({
  productHandle,
  variantId,
  onPlanSelect,
}) {
  const sdkRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    const sdk = new WidgetSDK(sdkConfig);
    sdkRef.current = sdk;

    unsubRef.current = sdk.on("plan:selected", (data) => {
      onPlanSelect?.(data);
    });

    sdk.initProduct(productHandle, {
      ...(variantId && { variantId }),
    });

    return () => {
      unsubRef.current?.();
      sdk.destroy();
    };
  }, [productHandle]);

  // Sync variant changes from parent
  const prevVariantRef = useRef(variantId);
  useEffect(() => {
    if (variantId && variantId !== prevVariantRef.current && sdkRef.current) {
      sdkRef.current.setVariant(variantId);
      prevVariantRef.current = variantId;
    }
  }, [variantId]);

  return <div className="Avada-SubscriptionWidget-Block" />;
}
