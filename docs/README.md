# joy-subscription-sdk

Headless SDK for integrating Joy Subscription with Shopify headless stores.

## Features

- Lightweight - SDK only ~2.3KB gzipped
- Modular - Import only what you need
- Auto script loading - SDK handles scripttag loading with deduplication
- Event-driven - Listen for widget events (plan selection, variant change, etc.)
- Framework agnostic - Works with React, Vue, Next.js, Hydrogen, etc.

## Installation

### Option A: NPM (React, Vue, Next.js, Hydrogen)

```bash
npm install joy-subscription-sdk
```

```javascript
import {WidgetSDK} from 'joy-subscription-sdk/widget';

const sdk = new WidgetSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});

await sdk.initProduct('product-handle');
```

### Option B: CDN Script Tag (Vanilla JS, Liquid, Webview)

No bundler needed. Add a script tag and configure via `window.AVADA_SUBSCRIPTION_CONFIG`.

```html
<script>
  window.AVADA_SUBSCRIPTION_CONFIG = {
    shopDomain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-storefront-access-token'
  };
</script>
<script src="https://unpkg.com/joy-subscription-sdk/dist/subscription-sdk.umd.js" defer></script>
```

Once loaded, the SDK is available at `window.AvadaSubscription`:

```html
<script>
  window.addEventListener('subscription:ready', function(e) {
    var sdk = e.detail.sdk;

    // Initialize product widget
    sdk.initProduct('product-handle');

    // Listen for add-to-cart events
    sdk.on('add-to-cart', function(data) {
      console.log('Add to cart:', data.lines, data.discountCodes);
    });
  });
</script>
```

### Option C: UMD Script Tag (Manual control)

Load individual feature bundles for smaller size:

```html
<!-- Load only what you need -->
<script src="https://unpkg.com/joy-subscription-sdk/dist/productBundle.umd.js"></script>
<script>
  // Global: window.ProductBundleSDK
  var sdk = new ProductBundleSDK.ProductBundleSDK({
    shopDomain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-storefront-access-token'
  });

  sdk.on('add-to-cart', function(data) {
    console.log('Bundle add to cart:', data);
  });

  sdk.initProductBundle('product-handle');
</script>
```

| UMD Bundle         | Script                    | Global Variable            |
| ------------------ | ------------------------- | -------------------------- |
| Widget             | `widget.umd.js`           | `window.WidgetSDK`         |
| Portal             | `portal.umd.js`           | `window.PortalSDK`         |
| Box                | `box.umd.js`              | `window.BoxSDK`            |
| Product Bundle     | `productBundle.umd.js`    | `window.ProductBundleSDK`  |
| CDN (all features) | `subscription-sdk.umd.js` | `window.AvadaSubscription` |

---

## Configuration (NPM)

### Per-instance config

```javascript
import {WidgetSDK} from 'joy-subscription-sdk/widget';

const sdk = new WidgetSDK({
  shopDomain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});
```

### Global config (recommended for SPA)

Configure once at app entry point, use anywhere without passing config.

```javascript
// _app.js, main.js, or app entry point
import {SubscriptionSDK} from 'joy-subscription-sdk';

SubscriptionSDK.configure({
  shopDomain: process.env.SHOPIFY_DOMAIN,
  storefrontAccessToken: process.env.STOREFRONT_TOKEN
});
```

Then use anywhere:

```javascript
import {WidgetSDK} from 'joy-subscription-sdk/widget';

// Option A: New instance (uses global config)
const sdk = new WidgetSDK();

// Option B: Singleton (recommended - shared across components)
const sdk = WidgetSDK.getInstance();
```

| Pattern                   | Use Case                                      |
| ------------------------- | --------------------------------------------- |
| `new WidgetSDK()`         | Component-scoped, cleaned up with component   |
| `WidgetSDK.getInstance()` | Shared across app, persists during navigation |

### Config Options

| Option                  | Required | Description                                            |
| ----------------------- | -------- | ------------------------------------------------------ |
| `shopDomain`            | Yes      | Shopify shop domain (e.g., `store.myshopify.com`)      |
| `storefrontAccessToken` | Yes      | Shopify Storefront API access token                    |
| `apiVersion`            | No       | Storefront API version (default: `2025-01`)            |
| `apiBaseUrl`            | No       | Custom API base URL (default: `https://sub.joyapp.gg`) |

---

## Bundle Options

### Standalone Bundles (recommended for single feature)

```javascript
import {WidgetSDK} from 'joy-subscription-sdk/widget'; // 2.3KB gzip
import {PortalSDK} from 'joy-subscription-sdk/portal'; // 2.6KB gzip
import {BoxSDK} from 'joy-subscription-sdk/box'; // 2.2KB gzip
import {ProductBundleSDK} from 'joy-subscription-sdk/productBundle'; // 2.4KB gzip
import {SubscriptionSDK} from 'joy-subscription-sdk'; // 3.5KB gzip (all)
```

### Light Bundles (for multiple features)

```javascript
import 'joy-subscription-sdk/core'; // 2.5KB gzip
import {WidgetSDK} from 'joy-subscription-sdk/widget/light'; // 1.0KB
import {PortalSDK} from 'joy-subscription-sdk/portal/light'; // 1.3KB
import {BoxSDK} from 'joy-subscription-sdk/box/light'; // 0.8KB
import {ProductBundleSDK} from 'joy-subscription-sdk/productBundle/light'; // 1.0KB
```

| Scenario        | Standalone | Light + Core | Recommended |
| --------------- | ---------- | ------------ | ----------- |
| Widget only     | **2.3KB**  | 3.5KB        | Standalone  |
| Portal only     | **2.6KB**  | 3.8KB        | Standalone  |
| Widget + Portal | 4.9KB      | **4.8KB**    | Light       |
| All 3 features  | 7.1KB      | **5.6KB**    | Light       |

---

## Events

### NPM usage

```javascript
const unsubscribe = sdk.on('add-to-cart', data => {
  console.log(data.lines, data.discountCodes);
});

// Stop listening
unsubscribe();

// Cleanup all listeners
sdk.destroy();
```

### CDN / Vanilla JS usage

```javascript
// SDK ready event
window.addEventListener('subscription:ready', function(e) {
  var sdk = e.detail.sdk;
  // SDK is ready, initialize features
});

// Add-to-cart event (from widget or bundle)
window.addEventListener('avada:add-to-cart', function(e) {
  var data = e.detail;
  console.log('Lines:', data.lines);
  console.log('Discount codes:', data.discountCodes);
});

// Plan selected event (from widget)
window.addEventListener('avada:plan:selected', function(e) {
  console.log('Selected plan:', e.detail);
});
```

### Available Events

| Event                | Description                           |
| -------------------- | ------------------------------------- |
| `subscription:ready` | SDK initialized and ready (CDN only)  |
| `add-to-cart`        | User clicked add to cart (bundle/box) |
| `plan:selected`      | User selected a subscription plan     |
| `init`               | Widget initialized                    |
| `portal:init`        | Customer portal initialized           |
| `box:init`           | Subscription box initialized          |

## Common API (BaseSDK)

All SDKs (WidgetSDK, PortalSDK, BoxSDK, ProductBundleSDK) inherit these methods:

```javascript
// Listen for events
const unsubscribe = sdk.on('plan:selected', (data) => { ... });

// Stop listening
unsubscribe();

// Get current selected plan
const plan = sdk.getSelectedPlan();

// Cleanup all listeners
sdk.destroy();
```

---

## Guides

| Guide                                        | Description                             |
| -------------------------------------------- | --------------------------------------- |
| [Product Widget](./product-widget.md)     | Subscription widget on product pages    |
| [Product Bundle](./product-bundle.md)     | Product bundle widget on product pages  |
| [Subscription Box](./subscription-box.md) | Subscription box on dedicated pages     |
| [Customer Portal](./customer-portal.md)   | Customer subscription management portal |

---

## Advanced Usage

### Direct Client Access

```javascript
import {SubscriptionClient} from 'joy-subscription-sdk/core';

const client = new SubscriptionClient({
  shopDomain: 'store.myshopify.com',
  storefrontAccessToken: 'xxxxx'
});

const shopData = await client.getShopData();
const productData = await client.getProductData('handle');
const combined = await client.getShopAndProductData('handle');
```

### Manual Script Loading

```javascript
await sdk.initProduct('handle', {autoLoadScript: false});

import {loadScript, SCRIPTS} from 'joy-subscription-sdk/core';
await loadScript(SCRIPTS.WIDGET);
```

### Script Utilities

```javascript
import {
  loadScript,
  isScriptLoaded,
  preloadScript,
  getScriptUrl,
  SCRIPTS
} from 'joy-subscription-sdk/core';

if (!isScriptLoaded(SCRIPTS.WIDGET)) {
  await loadScript(SCRIPTS.WIDGET);
}

getScriptUrl(SCRIPTS.WIDGET);
// -> https://cdn-joy-sub.avada.io/scripttag/avada-subscription-main.min.js?v=1.0.0
```

---

## License

MIT
