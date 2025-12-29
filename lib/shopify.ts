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

// lib/shopify.ts

export async function cancelOrder(orderNumber: string, reason?: string) {
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  
  console.log('🔍 Looking up order:', normalized);

  // Step 1: Find the order
  const findQuery = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            displayFinancialStatus
            displayFulfillmentStatus
            cancelledAt
          }
        }
      }
    }
  `;

  const findResult = await shopifyAdminRequest(findQuery);
  const order = findResult?.data?.orders?.edges?.[0]?.node;

  if (!order) {
    return { success: false, error: `Order ${normalized} not found` };
  }

  if (order.cancelledAt) {
    return { success: false, error: `Order ${normalized} is already cancelled` };
  }

  if (order.displayFulfillmentStatus === 'FULFILLED') {
    return { 
      success: false, 
      error: `Order ${normalized} has been fulfilled and cannot be cancelled.` 
    };
  }

  console.log('🚫 Cancelling order:', order.id);

  // Step 2: Cancel using GraphQL mutation
  const cancelMutation = `
    mutation OrderCancel($orderId: ID!, $notifyCustomer: Boolean, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!) {
      orderCancel(
        orderId: $orderId
        notifyCustomer: $notifyCustomer
        reason: $reason
        refund: $refund
        restock: $restock
      ) {
        job {
          id
          done
        }
        orderCancelUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    orderId: order.id,
    notifyCustomer: true,
    reason: mapCancelReasonGraphQL(reason),
    refund: true,
    restock: true,
  };

  console.log('📤 Sending cancel mutation with variables:', variables);

  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ 
        query: cancelMutation, 
        variables 
      }),
    }
  );

  const result = await response.json();
  console.log('📥 Cancel response:', JSON.stringify(result, null, 2));

  // Check for errors
  if (result.errors) {
    return { 
      success: false, 
      error: result.errors.map((e: any) => e.message).join(', ')
    };
  }

  const userErrors = result.data?.orderCancel?.orderCancelUserErrors;
  if (userErrors && userErrors.length > 0) {
    return { 
      success: false, 
      error: userErrors.map((e: any) => e.message).join(', ')
    };
  }

  // Success!
  return { 
    success: true, 
    orderNumber: order.name,
    message: `Order ${order.name} has been cancelled. Customer will be notified and refunded.`
  };
}

// Map reason to GraphQL enum
function mapCancelReasonGraphQL(reason?: string): string {
  const reasonLower = reason?.toLowerCase() || '';
  
  if (reasonLower.includes('fraud')) return 'FRAUD';
  if (reasonLower.includes('inventory') || reasonLower.includes('stock')) return 'INVENTORY';
  if (reasonLower.includes('declined')) return 'DECLINED';
  if (reasonLower.includes('other')) return 'OTHER';
  
  return 'CUSTOMER'; // Default
}

// lib/shopify.ts

// Verify order belongs to customer by email
export async function verifyOrderOwnership(orderNumber: string, email: string) {
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  
  const query = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            email
            displayFinancialStatus
            displayFulfillmentStatus
            cancelledAt
          }
        }
      }
    }
  `;

  const result = await shopifyAdminRequest(query);
  const order = result?.data?.orders?.edges?.[0]?.node;

  if (!order) {
    return { verified: false, reason: 'Order not found', order: null };
  }

  const orderEmail = order.email?.toLowerCase().trim();
  const customerEmail = email?.toLowerCase().trim();

  if (orderEmail !== customerEmail) {
    return { verified: false, reason: 'Email does not match our records for this order', order: null };
  }

  return { verified: true, reason: null, order };
}