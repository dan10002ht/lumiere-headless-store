# Product Bundle

Display the Joy Subscription Product Bundle widget on product pages in headless stores.

> **Prerequisites:** Complete the [common setup](../README.md#configuration) first.

## How It Works

```
SDK                              Widget (scripttag)              Headless Store
 |                                    |                               |
 |-- initProductBundle(handle) ------>|                               |
 |   (fetch bundle data + load script)|                               |
 |                                    |-- renders bundle widget ----->|
 |                                    |                               |
 |                                    |<-- user selects bundle -------|
 |                                    |<-- user clicks add to cart ---|
 |                                    |                               |
 |   avada:add-to-cart ---------------|--------------------------->   |
 |   (lines + discountCodes)          |                               |
```

1. SDK fetches bundle settings from shop metafield (`avada_product_bundle_settings`)
2. SDK fetches subscription data for products in bundles
3. SDK sets `window.AVADA_PRODUCT_BUNDLE` with bundle data
4. SDK loads widget script from CDN
5. Widget renders bundle options for the current product
6. When user adds bundle to cart, emits `avada:add-to-cart` event with GID-format lines + discount codes

---

## Quick Start

```javascript
import { ProductBundleSDK } from 'joy-subscription-sdk/productBundle';

const sdk = new ProductBundleSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token',
});

// Listen for add-to-cart events BEFORE init
sdk.on('add-to-cart', async (data) => {
  // data.lines - Array of CartLineInput (GID format)
  // data.discountCodes - Array of discount codes to apply
  await cartLinesAdd({ cartId, lines: data.lines });
  if (data.discountCodes.length > 0) {
    await cartDiscountCodesUpdate({ cartId, discountCodes: data.discountCodes });
  }
});

await sdk.initProductBundle('product-handle');
```

Your HTML must include the bundle container:

```html
<div class="Avada-ProductBundleData-Block" data-product='{"id": "123", "handle": "product-handle"}'></div>
```

---

## API

### `initProductBundle(handle, options?)`

Initialize the product bundle widget for a product page.

```javascript
await sdk.initProductBundle('my-product');

// With options
await sdk.initProductBundle('my-product', {
  autoLoadScript: true,   // Default: true - auto load widget script
});
```

**What it does:**
1. Fetches shop data via `client.getShopData()` (includes bundleSettings)
2. Finds bundles that include this product
3. Fetches subscription data for all products in active bundles
4. Sets `window.AVADA_SUBSCRIPTION` with shop data
5. Sets `window.AVADA_PRODUCT_BUNDLE` with bundle data
6. Loads widget script from CDN
7. Emits `avada:subscription:init` event

### `preloadProductBundle()`

Preload widget script into browser cache for faster page load.

```javascript
// Call early (e.g., on collection page or product card hover)
sdk.preloadProductBundle();
```

---

## Add to Cart (Headless)

In headless mode, the bundle widget emits an `avada:add-to-cart` event instead of calling `/cart/add.js`. Your headless store must handle this event.

```javascript
sdk.on('add-to-cart', async (data) => {
  // data.lines - Array of CartLineInput (GID format, ready for Storefront API)
  // data.discountCodes - Array of discount codes to apply

  // 1. Add lines to cart
  const { cart } = await cartLinesAdd({ cartId, lines: data.lines });

  // 2. Apply discount codes if any
  if (data.discountCodes.length > 0) {
    await cartDiscountCodesUpdate({ cartId, discountCodes: data.discountCodes });
  }
});
```

Each line in `data.lines`:

```javascript
{
  merchandiseId: 'gid://shopify/ProductVariant/123',
  quantity: 2,
  sellingPlanId: 'gid://shopify/SellingPlan/456',  // if subscription
}
```

GraphQL mutations:

```graphql
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { id }
    userErrors { field message }
  }
}

mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
    cart { id }
    userErrors { field message }
  }
}
```

---

## Framework Examples

### React / Next.js

```jsx
import { useEffect, useRef } from 'react';
import { ProductBundleSDK } from 'joy-subscription-sdk/productBundle';

export function ProductBundleWidget({ productHandle, cartId, cartLinesAdd, cartDiscountCodesUpdate }) {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = new ProductBundleSDK({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.NEXT_PUBLIC_STOREFRONT_TOKEN,
    });
    sdkRef.current = sdk;

    const unsubscribe = sdk.on('add-to-cart', async (data) => {
      await cartLinesAdd({ cartId, lines: data.lines });
      if (data.discountCodes.length > 0) {
        await cartDiscountCodesUpdate({ cartId, discountCodes: data.discountCodes });
      }
    });

    sdk.initProductBundle(productHandle);

    return () => {
      unsubscribe();
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
```

### Vue 3 / Nuxt 3

```vue
<template>
  <div
    class="Avada-ProductBundleData-Block"
    :data-product="JSON.stringify({ handle: productHandle })"
  />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { ProductBundleSDK } from 'joy-subscription-sdk/productBundle';
import { useCart } from '@/composables/useCart';

const props = defineProps({ productHandle: String });
const { cartId, cartLinesAdd, cartDiscountCodesUpdate } = useCart();

let sdk = null;
let unsubscribe = null;

onMounted(async () => {
  sdk = new ProductBundleSDK({
    shopDomain: import.meta.env.VITE_SHOPIFY_DOMAIN,
    storefrontAccessToken: import.meta.env.VITE_STOREFRONT_TOKEN,
  });

  unsubscribe = sdk.on('add-to-cart', async (data) => {
    await cartLinesAdd({ cartId: cartId.value, lines: data.lines });
    if (data.discountCodes.length > 0) {
      await cartDiscountCodesUpdate({ cartId: cartId.value, discountCodes: data.discountCodes });
    }
  });

  await sdk.initProductBundle(props.productHandle);
});

onUnmounted(() => {
  unsubscribe?.();
  sdk?.destroy();
});
</script>
```

---

## Bundle Data Structure

The bundle data comes from the shop metafield `avada_product_bundle_settings.data`:

```javascript
{
  bundles: [
    {
      id: "bundle-uuid",
      status: true,
      code: "BUNDLE_DISCOUNT_10",  // Discount code to apply
      products: [
        {
          id: "123",
          handle: "product-1",
          variants: [{ id: "456", ... }],
          ...
        },
        {
          id: "789",
          handle: "product-2",
          ...
        }
      ],
      discountType: "percentage",
      discountValue: 10,
      ...
    }
  ]
}
```

---

## Troubleshooting

### Bundle widget not rendering

1. Ensure `<div class="Avada-ProductBundleData-Block">` exists in DOM before calling `initProductBundle()`
2. Ensure `data-product` attribute contains valid JSON with product handle/id
3. Check if this product is part of any active bundle
4. Verify `window.AVADA_PRODUCT_BUNDLE` has valid bundle data

### Add to cart not working

In headless mode, the widget emits `avada:add-to-cart` instead of calling `/cart/add.js`. Make sure you're listening for this event:

```javascript
sdk.on('add-to-cart', async (data) => {
  await cartLinesAdd({ cartId, lines: data.lines });
  if (data.discountCodes.length > 0) {
    await cartDiscountCodesUpdate({ cartId, discountCodes: data.discountCodes });
  }
});
```

### Discount code not applying

The bundle discount code is included in `data.discountCodes`. Make sure to call `cartDiscountCodesUpdate` after adding items to cart:

```javascript
if (data.discountCodes.length > 0) {
  await cartDiscountCodesUpdate({ cartId, discountCodes: data.discountCodes });
}
```
