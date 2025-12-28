// lib/shopify.ts

export async function shopifyAdminRequest(query: string) {
  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query }),
    }
  );

  return response.json();
}

// Existing function
export async function getOrderByNumber(orderNumber: string) {
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  
  const query = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            email
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminRequest(query);
  return data?.data?.orders?.edges?.[0]?.node || null;
}

// NEW: Get customer by email
export async function getCustomerByEmail(email: string) {
  const query = `
    {
      customers(first: 1, query: "email:${email}") {
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            numberOfOrders
            amountSpent {
              amount
              currencyCode
            }
            createdAt
            defaultAddress {
              city
              province
              country
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminRequest(query);
  return data?.data?.customers?.edges?.[0]?.node || null;
}

// NEW: Get orders by customer email
export async function getOrdersByCustomerEmail(email: string, limit: number = 5) {
  const query = `
    {
      orders(first: ${limit}, query: "email:${email}") {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminRequest(query);
  return data?.data?.orders?.edges?.map((e: any) => e.node) || [];
}

// NEW: Search products
export async function searchProducts(searchTerm: string, limit: number = 5) {
  const query = `
    {
      products(first: ${limit}, query: "title:*${searchTerm}*") {
        edges {
          node {
            id
            title
            description
            handle
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            totalInventory
            status
            featuredImage {
              url
            }
            variants(first: 5) {
              edges {
                node {
                  title
                  price
                  availableForSale
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminRequest(query);
  return data?.data?.products?.edges?.map((e: any) => e.node) || [];
}

// NEW: Get order with fulfillment/tracking details
export async function getOrderWithTracking(orderNumber: string) {
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  
  const query = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            email
            displayFulfillmentStatus
            fulfillments {
              status
              createdAt
              updatedAt
              deliveredAt
              estimatedDeliveryAt
              trackingInfo {
                company
                number
                url
              }
            }
            shippingAddress {
              firstName
              lastName
              city
              province
              country
              zip
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminRequest(query);
  return data?.data?.orders?.edges?.[0]?.node || null;
}