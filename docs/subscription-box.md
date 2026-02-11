# Subscription Box

Display the Joy Subscription Box on dedicated pages in headless stores.

> **Prerequisites:** Complete the [common setup](../README.md#configuration) first.

## How It Works

```
SDK                              Widget (scripttag)              Headless Store
 |                                    |                               |
 |-- initSubscriptionBox() ---------->|                               |
 |   (fetch shop data + load scripts) |                               |
 |                                    |-- renders box UI ------------>|
 |                                    |                               |
 |                                    |-- fetches product list ------>|
 |                                    |   (POST /subscription-products/box)
 |                                    |                               |
 |                                    |<-- user selects frequency ----|
 |                                    |<-- user adds products --------|
 |                                    |<-- user clicks checkout ------|
 |                                    |                               |
 |   avada:add-to-cart ---------------|--------------------------->   |
 |   (lines + discountCodes)          |                               |
```

1. SDK fetches shop-level data via Storefront API metafields (includes box config)
2. SDK loads box scripts from CDN (`avada-subscription-box-main.min.js`)
3. Scripttag reads box config from `window.AVADA_SUBSCRIPTION_BOX`
4. Box component fetches product list from internal API
5. User goes through steps: Select Frequency -> Add Products -> Checkout
6. Checkout emits `avada:add-to-cart` event with GID-format cart lines + discount codes

---

## Quick Start

```javascript
import {BoxSDK} from 'joy-subscription-sdk/box';

const sdk = new BoxSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});

await sdk.initSubscriptionBox();
```

Your HTML must include the box container:

```html
<div class="Avada-SubscriptionBox__Wrapper"></div>
```

---

## API

### `initSubscriptionBox(options?)`

Initialize the subscription box page.

```javascript
await sdk.initSubscriptionBox();

// With options
await sdk.initSubscriptionBox({
  autoLoadScript: true, // Default: true - auto load box scripts
  includeFixedBundle: true // Default: true - also load fixed bundle script
});
```

**What it does:**

1. Fetches shop data via `client.getShopData()` (includes `subscriptionBox` metafield + localization)
2. Sets `window.AVADA_SUBSCRIPTION` with shop data + `isSubscriptionBox: true`
3. Sets `window.AVADA_SUBSCRIPTION_BOX` with box config (for scripttag)
4. Initializes `window.Shopify` globals (currency, country, shop, routes) from Storefront API localization data
5. Loads box scripts from CDN
6. Emits `avada:box:init` event

### `destroySubscriptionBox()`

Cleanup subscription box UI. **Required for SPA** - call when navigating away from the box page to remove portaled elements (float cart, drawer, backdrop) that persist on `document.body`.

```javascript
sdk.destroySubscriptionBox();
```

**What it cleans up:**

- Portaled elements on `document.body` (float cart drawer, mobile drawer, backdrop)
- Custom CSS injected by the box
- `document.body` overflow style (mobile drawer sets `overflow: hidden`)
- `window.AVADA_SUBSCRIPTION_BOX`

### `preloadSubscriptionBox()`

Preload box scripts into browser cache for faster page load.

```javascript
// Call early (e.g., on navigation intent)
sdk.preloadSubscriptionBox();
```

---

## Routing Requirement

Headless stores **must** use the URL pattern `/pages/subscription-box?boxId=xxx`.

The scripttag uses the URL to:

1. Detect that it's a box page (`pathname.includes('/pages/subscription-box')`)
2. Extract the box ID from the path or query param

---

## Add to Cart (Headless)

In headless mode, the box does **not** call `/cart/add.js`. Instead it emits an `avada:add-to-cart` event with Storefront API-ready cart lines in GID format.

```javascript
sdk.on('add-to-cart', async data => {
  // data.lines         - Array of CartLineInput (GID format, ready for Storefront API)
  // data.discountCodes - Array of discount codes to apply (e.g., ['JOY_BOX_DISCOUNT'])

  // 1. Add lines to cart
  const {cart} = await cartLinesAdd({cartId, lines: data.lines});

  // 2. Apply discount codes if any
  if (data.discountCodes.length > 0) {
    await cartDiscountCodesUpdate({cartId, discountCodes: data.discountCodes});
  }
});
```

Each line in `data.lines`:

```javascript
{
  merchandiseId: 'gid://shopify/ProductVariant/123',
  quantity: 2,
  sellingPlanId: 'gid://shopify/SellingPlan/456',  // if subscription
  attributes: [                                      // box tracking
    { key: '__box_id', value: 'box-uuid' },
    { key: '__original_price', value: '2999' }
  ]
}
```

No redirect happens in headless mode - your store handles navigation after cart update.

`cartDiscountCodesUpdate` mutation:

```graphql
mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
    cart {
      id
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## Box Types

### Dynamic Box

User selects products from a curated list. Steps:

1. **Select Frequency** - Choose subscription interval
2. **Add Products** - Browse and add products to box
3. **Checkout** - Review and purchase

### Fixed Bundle Box

Pre-configured box with fixed products. Steps:

1. **Select Box** - Choose from available box options
2. **Add Staples** - Add required staple items
3. **Add One-Time** - Optionally add one-time items
4. **Checkout** - Review and purchase

Requires additional script: `avada-subscription-box-fixed-bundle-main.min.js` (loaded by default when `includeFixedBundle: true`).

---

## Box Data Structure

The box data comes from the shop metafield `avada_subscription_box.data`:

```javascript
{
  boxes: [
    {
      id: "box-uuid",
      type: "dynamic" | "fixed_bundle",
      settings: {
        subscriptionProducts: {
          enabledCategories: boolean,
          productSettings: { selectedProducts: [...] },
          categorySettings: { selectedCategories: [...] }
        },
        frequencyStepSettings: {
          layout: string,
          showOneTimePurchase: boolean
        },
        boxDiscount: {
          discountTiers: [...],
          discountType: string,
          requirements: string
        },
        boxSummary: {
          payment: {
            buttonText: string,
            buttonRedirectsTo: "checkout" | "cart"
          }
        }
      },
      design: {
        customCss: string,
        enableCustomCss: boolean
      }
    }
  ]
}
```

---

## Framework Examples

### React / Next.js

```jsx
import {useEffect} from 'react';
import {BoxSDK} from 'joy-subscription-sdk/box';

export function SubscriptionBoxPage() {
  useEffect(() => {
    const sdk = new BoxSDK({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.NEXT_PUBLIC_STOREFRONT_TOKEN
    });

    sdk.initSubscriptionBox();

    // Cleanup on SPA navigation
    return () => sdk.destroySubscriptionBox();
  }, []);

  return <div className="Avada-SubscriptionBox__Wrapper" />;
}
```

### Vue 3 / Nuxt 3

```vue
<template>
  <div class="Avada-SubscriptionBox__Wrapper" />
</template>

<script setup>
import {onMounted, onBeforeUnmount} from 'vue';
import {BoxSDK} from 'joy-subscription-sdk/box';

let sdk;

onMounted(async () => {
  sdk = new BoxSDK({
    shopDomain: import.meta.env.VITE_SHOPIFY_DOMAIN,
    storefrontAccessToken: import.meta.env.VITE_STOREFRONT_TOKEN
  });

  await sdk.initSubscriptionBox();
});

// Cleanup on SPA navigation
onBeforeUnmount(() => {
  sdk?.destroySubscriptionBox();
});
</script>
```

---

## Troubleshooting

### Box not rendering

1. Ensure `<div class="Avada-SubscriptionBox__Wrapper">` exists in DOM before loading scripts
2. Ensure `window.AVADA_SUBSCRIPTION_BOX` has valid box data with `boxes` array
3. URL must contain `/pages/subscription-box` or `?boxId=xxx`
4. Check browser console for errors

### Products not loading

The box fetches products from internal API (`/subscription-products/box`). This requires:

1. Shop must have subscription box configured with products
2. Network access to the Joy Subscription API

### Float cart / drawer persists after navigating away (SPA)

The box uses `createPortal` to render the float cart and mobile drawer on `document.body`. In SPAs, these elements persist across page navigations. Call `destroySubscriptionBox()` on cleanup:

```javascript
// React: return cleanup from useEffect
return () => sdk.destroySubscriptionBox();

// Vue: onBeforeUnmount
onBeforeUnmount(() => sdk?.destroySubscriptionBox());
```

### Checkout button does nothing

In headless mode, the box emits `avada:add-to-cart` instead of calling `/cart/add.js`. Make sure you're listening for this event:

```javascript
sdk.on('add-to-cart', async data => {
  await cartLinesAdd({cartId, lines: data.lines});
  if (data.discountCodes.length > 0) {
    await cartDiscountCodesUpdate({cartId, discountCodes: data.discountCodes});
  }
});
```
