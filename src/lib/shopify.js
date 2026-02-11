const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

async function shopifyFetch({ query, variables = {} }) {
  const url = `https://${domain}/api/2024-01/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error("Shopify API Error:", json.errors);
    throw new Error(json.errors[0]?.message || "Shopify API error");
  }

  return json.data;
}

// ============ PRODUCT QUERIES ============

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    handle
    description
    descriptionHtml
    productType
    tags
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

export async function getProducts({ first = 12, after = null } = {}) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: BEST_SELLING) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...ProductFields
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { first, after } });
  return {
    products: data.products.edges.map((edge) => edge.node),
    pageInfo: data.products.pageInfo,
  };
}

export async function getProductByHandle(handle) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProductByHandle($handle: String!) {
      product(handle: $handle) {
        ...ProductFields
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { handle } });
  return data.product;
}

// ============ COLLECTION QUERIES ============

const COLLECTION_FRAGMENT = `
  fragment CollectionFields on Collection {
    id
    title
    handle
    description
    image {
      url
      altText
      width
      height
    }
  }
`;

export async function getCollections(first = 12) {
  const query = `
    ${COLLECTION_FRAGMENT}
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            ...CollectionFields
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { first } });
  return data.collections.edges.map((edge) => edge.node);
}

export async function getCollectionByHandle(handle, first = 20, after = null) {
  const query = `
    ${PRODUCT_FRAGMENT}
    ${COLLECTION_FRAGMENT}
    query GetCollectionByHandle($handle: String!, $first: Int!, $after: String) {
      collection(handle: $handle) {
        ...CollectionFields
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              ...ProductFields
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({
    query,
    variables: { handle, first, after },
  });

  if (!data.collection) return null;

  return {
    ...data.collection,
    products: data.collection.products.edges.map((edge) => edge.node),
    pageInfo: data.collection.products.pageInfo,
  };
}

// ============ SEARCH ============

export async function searchProducts(searchQuery, first = 20) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query SearchProducts($query: String!, $first: Int!) {
      search(query: $query, first: $first, types: [PRODUCT]) {
        edges {
          node {
            ... on Product {
              ...ProductFields
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({
    query,
    variables: { query: searchQuery, first },
  });
  return data.search.edges.map((edge) => edge.node);
}

// ============ CART MUTATIONS ============

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
                width
                height
              }
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export async function createCart() {
  const query = `
    ${CART_FRAGMENT}
    mutation CreateCart {
      cartCreate {
        cart {
          ...CartFields
        }
      }
    }
  `;

  const data = await shopifyFetch({ query });
  return data.cartCreate.cart;
}

export async function addToCart(cartId, lines) {
  const query = `
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
      }
    }
  `;

  const data = await shopifyFetch({
    query,
    variables: { cartId, lines },
  });
  return data.cartLinesAdd.cart;
}

export async function updateCart(cartId, lines) {
  const query = `
    ${CART_FRAGMENT}
    mutation UpdateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
      }
    }
  `;

  const data = await shopifyFetch({
    query,
    variables: { cartId, lines },
  });
  return data.cartLinesUpdate.cart;
}

export async function removeFromCart(cartId, lineIds) {
  const query = `
    ${CART_FRAGMENT}
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
      }
    }
  `;

  const data = await shopifyFetch({
    query,
    variables: { cartId, lineIds },
  });
  return data.cartLinesRemove.cart;
}

// ============ HELPERS ============

export function formatPrice(amount, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}
