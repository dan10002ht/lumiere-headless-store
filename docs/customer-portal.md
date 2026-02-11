# Customer Portal

Display the Joy Subscription Customer Portal on headless stores.

> **Prerequisites:** Complete the [common setup](../README.md#configuration) first.

## How It Works

```
SDK                              Scripttag (portal)              Headless Store
 |                                    |                               |
 |-- initCustomerPortal() ---------->|                               |
 |   (fetch shop data + load script) |                               |
 |                                    |-- handles authentication ---->|
 |                                    |   (OAuth 2.0 / OTP / HMAC)   |
 |                                    |                               |
 |                                    |-- renders portal UI --------->|
 |                                    |   (subscriptions, orders)     |
 |                                    |                               |
 |                                    |-- user manages subscriptions->|
 |                                    |   (pause, resume, cancel...)  |
```

1. SDK fetches shop-level data via Storefront API metafields (settings, translations)
2. SDK sets `window.AVADA_SUBSCRIPTION` with shop data
3. SDK loads portal script from CDN (`avada-customer-portal-main.min.js`)
4. Scripttag handles customer authentication (OAuth 2.0 + PKCE, legacy OTP, Shopify HMAC)
5. Scripttag renders portal UI into `#Avada-SubscriptionManagement__Container`
6. All subscription management (pause, resume, cancel, update) is handled internally by the scripttag

---

## Quick Start

```javascript
import {PortalSDK} from 'joy-subscription-sdk/portal';

const sdk = new PortalSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});

await sdk.initCustomerPortal();
```

Your HTML must include the portal container:

```html
<div id="Avada-SubscriptionManagement__Container"></div>
```

---

## API

### `initCustomerPortal(options?)`

Initialize the customer portal page.

```javascript
await sdk.initCustomerPortal();

// With options
await sdk.initCustomerPortal({
  autoLoadScript: true, // Default: true - auto load portal script
  customer: {
    // Optional: pre-authenticated customer data
    id: 'gid://shopify/Customer/123',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

**What it does:**

1. Fetches shop data via `client.getShopData()` (includes settings + translations + localization)
2. Sets `window.AVADA_SUBSCRIPTION` with shop data + `shopId` + `isPortal: true`
3. Initializes `window.Shopify` globals (currency, country, shop, routes)
4. Loads portal script from CDN
5. Injects headless-specific CSS (text colors, typography) + adds `.Avada-CustomerPortal--Headless` class to body and container
6. Emits `avada:portal:init` event

**Authentication:** The scripttag handles authentication internally. It supports:

- **Customer Account API** (OAuth 2.0 + PKCE) - recommended
- **Legacy OTP** - email/OTP login flow
- **Shopify HMAC** - merchant preview mode

If you pass `customer` in options, the scripttag will use that data and skip the login step.

### `destroyCustomerPortal()`

Cleanup portal UI. **Required for SPA** - call when navigating away from the portal page.

```javascript
sdk.destroyCustomerPortal();
```

**What it cleans up:**

- Portaled elements on `document.body` (mobile tabs)
- Portal container content
- `.Avada-CustomerPortal--Headless` class from body and container

### `preloadPortal()`

Preload portal script into browser cache for faster page load.

```javascript
// Call early (e.g., on navigation intent)
sdk.preloadPortal();
```

---

## Routing Requirement

Headless stores should use the URL pattern `/pages/joy-subscription` with sub-routes:

| Path                                                     | Page                |
| -------------------------------------------------------- | ------------------- |
| `/pages/joy-subscription`                                | Subscription list   |
| `/pages/joy-subscription/subscription?contractId=xxx`    | Subscription detail |
| `/pages/joy-subscription/order`                          | Order details       |
| `/pages/joy-subscription/upcoming-orders`                | Upcoming orders     |

The scripttag derives the current page from `window.location.pathname` relative to the portal base path.

---

## Authentication Flow

### Customer Account API (Recommended)

The portal scripttag implements the full OAuth 2.0 + PKCE flow:

1. User visits portal page → scripttag checks for existing session
2. No session → redirects to Shopify Customer Account API auth endpoint
3. Shopify authenticates → redirects back with `authToken` query param
4. Scripttag exchanges `authToken` for session → renders portal

This flow works automatically in headless - no additional code needed from the store.

### Pre-authenticated Customer

If your headless store already has the customer logged in, pass the customer data to skip the auth step:

```javascript
await sdk.initCustomerPortal({
  customer: {
    id: 'gid://shopify/Customer/123',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

---

## Framework Examples

### React / Next.js

```jsx
import {useEffect} from 'react';
import {PortalSDK} from 'joy-subscription-sdk/portal';

export function CustomerPortalPage({cartId, cartLinesAdd}) {
  useEffect(() => {
    const sdk = new PortalSDK({
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.NEXT_PUBLIC_STOREFRONT_TOKEN
    });

    // Handle "Add new subscription" action
    const unsubscribe = sdk.on('add-to-cart', async data => {
      await cartLinesAdd({cartId, lines: data.lines});
      window.location.href = '/checkout';
    });

    sdk.initCustomerPortal();

    // Cleanup on SPA navigation
    return () => {
      unsubscribe();
      sdk.destroyCustomerPortal();
    };
  }, []);

  return <div id="Avada-SubscriptionManagement__Container" />;
}
```

### Vue 3 / Nuxt 3

```vue
<template>
  <div id="Avada-SubscriptionManagement__Container" />
</template>

<script setup>
import {onMounted, onBeforeUnmount} from 'vue';
import {PortalSDK} from 'joy-subscription-sdk/portal';
import {useCart} from '@/composables/useCart';

const {cartId, cartLinesAdd} = useCart();
let sdk;
let unsubscribe;

onMounted(async () => {
  sdk = new PortalSDK({
    shopDomain: import.meta.env.VITE_SHOPIFY_DOMAIN,
    storefrontAccessToken: import.meta.env.VITE_STOREFRONT_TOKEN
  });

  // Handle "Add new subscription" action
  unsubscribe = sdk.on('add-to-cart', async data => {
    await cartLinesAdd({cartId: cartId.value, lines: data.lines});
    window.location.href = '/checkout';
  });

  await sdk.initCustomerPortal();
});

// Cleanup on SPA navigation
onBeforeUnmount(() => {
  unsubscribe?.();
  sdk?.destroyCustomerPortal();
});
</script>
```

---

## Add to Cart (Headless)

When users click "Add new subscription" in the customer portal, the scripttag emits an `avada:add-to-cart` event instead of calling `/cart/add.js`. Your headless store must handle this event.

```javascript
sdk.on('add-to-cart', async data => {
  // data.lines - Array of CartLineInput (GID format, ready for Storefront API)
  const {cart} = await cartLinesAdd({cartId, lines: data.lines});

  // Redirect to checkout or open cart drawer
  window.location.href = '/checkout';
});
```

Each line in `data.lines`:

```javascript
{
  merchandiseId: 'gid://shopify/ProductVariant/123',
  quantity: 2,
  sellingPlanId: 'gid://shopify/SellingPlan/456',
}
```

---

## Headless Styles

In Shopify themes, text colors inherit from the theme's CSS. In headless stores, the SDK automatically injects styles to ensure proper text visibility.

**Automatic behavior:**

- Injects CSS with `.Avada-CustomerPortal--Headless` selector
- Adds the class to `document.body` and `#Avada-SubscriptionManagement__Container`
- Sets text color, font-family, and line-height
- Handles modals rendered via `createPortal` to body

**Styles applied:**

```css
.Avada-CustomerPortal--Headless {
  color: var(--sub-color-primary, #1c1c1c);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
}
```

**Customization:** Override CSS variables or the `.Avada-CustomerPortal--Headless` class in your stylesheets:

```css
.Avada-CustomerPortal--Headless {
  font-family: 'Your Custom Font', sans-serif;
}
```

---

## Troubleshooting

### Portal not rendering

1. Ensure `<div id="Avada-SubscriptionManagement__Container">` exists in DOM before loading scripts
2. Ensure `window.AVADA_SUBSCRIPTION` has valid shop data with `shopId`
3. Check browser console for errors

### Authentication redirect loop

The Customer Account API OAuth flow requires:

1. Your headless store domain must be configured as a valid redirect URL
2. Network access to the Joy Subscription API for token exchange

### Mobile tabs persist after navigating away (SPA)

The portal uses `createPortal` to render mobile tabs on `document.body`. In SPAs, call `destroyCustomerPortal()` on cleanup:

```javascript
// React: return cleanup from useEffect
return () => sdk.destroyCustomerPortal();

// Vue: onBeforeUnmount
onBeforeUnmount(() => sdk?.destroyCustomerPortal());
```

### Text colors not visible

The SDK automatically injects headless styles. If text is still invisible:

1. Check if `.Avada-CustomerPortal--Headless` class is on body and container
2. Ensure your CSS doesn't override with `color: transparent` or similar
3. The styles are injected 100ms after script load - if rendering before this, wait for `avada:portal:init` event
