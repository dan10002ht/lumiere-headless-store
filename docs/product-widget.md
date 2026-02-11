# Product Widget

Display the Joy Subscription widget on product pages in headless stores.

> **Prerequisites:** Complete the [common setup](../README.md#configuration) first.

## How It Works

```
SDK                          Widget (scripttag)           Headless Store
 |                               |                            |
 |-- initProduct(handle) ------->|                            |
 |   (fetch data + load script)  |                            |
 |                               |-- renders widget UI ------>|
 |                               |                            |
 |                               |<-- user selects plan ------|
 |                               |                            |
 |   avada:plan:selected --------|--------------------------->|
 |                               |                            |
 |<-- sdk.setVariant(id) --------|<---------------------------|
 |                               |   (widget updates plans)   |
```

1. SDK fetches subscription data via Storefront API metafields (no rate limit)
2. SDK loads the widget script from CDN
3. Widget renders inside `<div class="Avada-SubscriptionWidget-Block">`
4. Widget emits events when user interacts (plan selection, variant change)
5. Headless store listens to events and uses GID-format IDs for cart operations

---

## Quick Start

```javascript
import { WidgetSDK } from 'joy-subscription-sdk/widget';

const sdk = new WidgetSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token',
});

// Listen for plan selection BEFORE init
sdk.on('plan:selected', (data) => {
  console.log(data);
  // {
  //   productId:    'gid://shopify/Product/123',
  //   variantId:    'gid://shopify/ProductVariant/456',
  //   sellingPlanId: 'gid://shopify/SellingPlan/789' or null,
  //   plan:          { ... } or null
  // }
});

// Initialize (fetches data + loads widget script)
await sdk.initProduct('product-handle');
```

Your HTML must include the widget container:

```html
<div class="Avada-SubscriptionWidget-Block"></div>
```

---

## API

### `initProduct(handle, options?)`

Initialize widget for a product page.

```javascript
await sdk.initProduct('my-product');

// With options
await sdk.initProduct('my-product', {
  variantId: '47276042485996',       // Pre-select variant
  autoLoadScript: true,               // Default: true
});
```

### `initShop()`

Fetch shop-level data only (no product, no script). Useful for collection pages or pre-fetching settings.

```javascript
const shopData = await sdk.initShop();
```

### `preloadWidget()`

Preload widget script into browser cache for faster product page load.

```javascript
// On collection page or product card hover
sdk.preloadWidget();
```

### `setVariant(variantId)`

Notify widget when your headless variant selector changes. The widget will update available plans accordingly.

```javascript
// Accepts numeric ID or GID format
sdk.setVariant(47276042485996);
sdk.setVariant('gid://shopify/ProductVariant/47276042485996');
```

### `setQuantity(quantity)`

Notify widget when quantity changes (for quantity-based pricing).

```javascript
sdk.setQuantity(3);
```

---

## Events

### `plan:selected`

Fires when user selects a subscription plan **or** one-time purchase.

```javascript
sdk.on('plan:selected', (data) => {
  data.productId      // 'gid://shopify/Product/123'
  data.variantId      // 'gid://shopify/ProductVariant/456'
  data.sellingPlanId  // 'gid://shopify/SellingPlan/789' or null (one-time)
  data.plan           // Full plan object or null (one-time)
});
```

**One-time purchase:** `sellingPlanId` = `null`, `plan` = `null`
**Subscription:** Both have values, `sellingPlanId` is in GID format

### `variant:changed`

Fires when user changes variant through the widget.

```javascript
sdk.on('variant:changed', (variant) => {
  variant.id
  variant.title
  variant.price
});
```

### `widget:ready`

Fires when widget finishes rendering.

```javascript
sdk.on('widget:ready', () => {
  // Widget is visible and interactive
});
```

### `add-to-cart`

Fires when widget's add-to-cart button is clicked (e.g., "Add new subscription" in customer portal).

```javascript
sdk.on('add-to-cart', (data) => {
  // data.lines is an array ready for cartLinesAdd mutation
  data.lines.forEach(line => {
    line.merchandiseId   // 'gid://shopify/ProductVariant/456'
    line.quantity        // 1
    line.sellingPlanId   // 'gid://shopify/SellingPlan/789' or null
  });
  data.discountCodes     // [] (reserved for future use)
});
```

Use directly with Storefront API:

```javascript
sdk.on('add-to-cart', async ({ lines }) => {
  await cartLinesAdd({ cartId, lines });
});
```

---

## Add to Cart

The `plan:selected` event emits IDs in GID format, ready for the Storefront API `cartLinesAdd` mutation:

```javascript
let currentSelection = null;

sdk.on('plan:selected', (data) => {
  currentSelection = data;
});

// When user clicks your add-to-cart button:
function addToCart(cartId) {
  if (!currentSelection) return;

  const lines = [{
    merchandiseId: currentSelection.variantId,
    quantity: 1,
    ...(currentSelection.sellingPlanId && {
      sellingPlanId: currentSelection.sellingPlanId,
    }),
  }];

  // Use your Storefront API client
  return cartLinesAdd({ cartId, lines });
}
```

`cartLinesAdd` mutation:

```graphql
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      totalQuantity
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## Framework Examples

### React / Next.js

```jsx
// components/SubscriptionWidget.jsx
import { useEffect, useRef } from 'react';
import { WidgetSDK } from 'joy-subscription-sdk/widget';

export function SubscriptionWidget({ productHandle, onPlanSelect }) {
  const sdkRef = useRef(null);

  useEffect(() => {
    const sdk = new WidgetSDK({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.NEXT_PUBLIC_STOREFRONT_TOKEN,
    });
    sdkRef.current = sdk;

    const unsubscribe = sdk.on('plan:selected', onPlanSelect);
    sdk.initProduct(productHandle);

    return () => {
      unsubscribe();
      sdk.destroy();
    };
  }, [productHandle]);

  return <div className="Avada-SubscriptionWidget-Block" />;
}
```

Usage:

```jsx
function ProductPage({ product }) {
  const [selection, setSelection] = useState(null);

  const handleAddToCart = () => {
    if (!selection) return;
    cartLinesAdd({
      lines: [{
        merchandiseId: selection.variantId,
        quantity: 1,
        ...(selection.sellingPlanId && { sellingPlanId: selection.sellingPlanId }),
      }],
    });
  };

  return (
    <div>
      <h1>{product.title}</h1>
      <SubscriptionWidget
        productHandle={product.handle}
        onPlanSelect={setSelection}
      />
      <button onClick={handleAddToCart}>
        {selection?.plan ? 'Subscribe' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

### React / Next.js (SPA with global config)

```jsx
// _app.js
import { SubscriptionSDK } from 'joy-subscription-sdk';

SubscriptionSDK.configure({
  shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
  storefrontAccessToken: process.env.NEXT_PUBLIC_STOREFRONT_TOKEN,
});
```

```jsx
// components/SubscriptionWidget.jsx
import { useEffect } from 'react';
import { WidgetSDK } from 'joy-subscription-sdk/widget';

export function SubscriptionWidget({ productHandle, onPlanSelect }) {
  useEffect(() => {
    const sdk = WidgetSDK.getInstance();
    const unsubscribe = sdk.on('plan:selected', onPlanSelect);
    sdk.initProduct(productHandle);

    return () => unsubscribe();
    // Don't destroy singleton on unmount
  }, [productHandle]);

  return <div className="Avada-SubscriptionWidget-Block" />;
}
```

### Vue 3 / Nuxt 3

```vue
<template>
  <div class="Avada-SubscriptionWidget-Block" />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { WidgetSDK } from 'joy-subscription-sdk/widget';

const props = defineProps({ productHandle: String });
const emit = defineEmits(['plan-selected']);

let sdk = null;
let unsubscribe = null;

onMounted(async () => {
  sdk = new WidgetSDK({
    shopDomain: import.meta.env.VITE_SHOPIFY_DOMAIN,
    storefrontAccessToken: import.meta.env.VITE_STOREFRONT_TOKEN,
  });

  unsubscribe = sdk.on('plan:selected', (data) => emit('plan-selected', data));
  await sdk.initProduct(props.productHandle);
});

onUnmounted(() => {
  unsubscribe?.();
  sdk?.destroy();
});
</script>
```

### Hydrogen (Remix)

```jsx
import { useEffect, useRef } from 'react';
import { WidgetSDK } from 'joy-subscription-sdk/widget';

export function SubscriptionWidget({ productHandle, shop, onPlanSelect }) {
  const sdkRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sdk = new WidgetSDK({
      shopDomain: shop.primaryDomain.url,
      storefrontAccessToken: shop.storefrontAccessToken,
    });
    sdkRef.current = sdk;

    const unsubscribe = sdk.on('plan:selected', onPlanSelect);
    sdk.initProduct(productHandle);

    return () => {
      unsubscribe();
      sdk.destroy();
    };
  }, [productHandle]);

  return <div className="Avada-SubscriptionWidget-Block" />;
}
```

### Vanilla JavaScript

```html
<div class="Avada-SubscriptionWidget-Block"></div>
<button id="add-to-cart">Add to Cart</button>

<script type="module">
  import { WidgetSDK } from 'joy-subscription-sdk/widget';

  const sdk = new WidgetSDK({
    shopDomain: 'your-store.myshopify.com',
    storefrontAccessToken: 'xxxxx',
  });

  let selection = null;

  sdk.on('plan:selected', (data) => {
    selection = data;
  });

  await sdk.initProduct('product-handle');

  document.getElementById('add-to-cart').onclick = () => {
    if (!selection) return;

    const lines = [{
      merchandiseId: selection.variantId,
      quantity: 1,
      ...(selection.sellingPlanId && { sellingPlanId: selection.sellingPlanId }),
    }];

    // Use with your cart API
    cartLinesAdd({ cartId: 'your-cart-id', lines });
  };
</script>
```

---

## Troubleshooting

### Widget not rendering

1. Ensure `<div class="Avada-SubscriptionWidget-Block">` exists in DOM **before** calling `initProduct()`
2. Check browser console for errors
3. Verify Storefront API token has `unauthenticated_read_product_listings` and `unauthenticated_read_metaobjects` scopes

### Variant sync not working

Make sure to call `sdk.setVariant(variantId)` whenever your variant selector changes:

```javascript
// Your variant selector handler
const onVariantChange = (variantId) => {
  updateURL(variantId);        // Your logic
  sdk.setVariant(variantId);   // Notify widget
};
```

### CORS errors

Add your headless domain to Shopify's allowed origins for Storefront API.

### Script not loading

1. Check network tab for blocked requests
2. Verify CDN (`cdn-joy-sub.avada.io`) is accessible
3. Try manual loading: `sdk.initProduct('handle', { autoLoadScript: false })`
