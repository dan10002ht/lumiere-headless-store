"use client";

import { useEffect, useRef } from "react";
import { WidgetSDK } from "joy-subscription-sdk/widget";

export default function SubscriptionWidget({
  productHandle,
  variantId,
  onPlanSelect,
}) {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = WidgetSDK.getInstance();
    sdkRef.current = sdk;

    const unsubscribe = sdk.on("plan:selected", onPlanSelect);
    sdk.initProduct(productHandle);

    return () => unsubscribe();
    // Don't destroy singleton on unmount
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
