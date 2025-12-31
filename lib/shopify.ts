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
            createdAt
            customer {
              email
            }
            displayFinancialStatus
            displayFulfillmentStatus
            cancelledAt
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

  const result = await shopifyAdminRequest(query);
  const order = result?.data?.orders?.edges?.[0]?.node;

  if (!order) {
    return { verified: false, reason: 'Order not found', order: null };
  }

  const customerEmail = email?.toLowerCase().trim();
  const orderEmail = order.email?.toLowerCase().trim();
  const customerObjectEmail = order.customer?.email?.toLowerCase().trim();

  const emailMatches = 
    orderEmail === customerEmail || 
    customerObjectEmail === customerEmail;

  if (!emailMatches) {
    console.log('❌ Email mismatch:', { provided: customerEmail, orderEmail, customerObjectEmail });
    return { verified: false, reason: 'Email does not match our records', order: null };
  }

  console.log('✅ Email verified:', customerEmail);
  return { verified: true, reason: null, order };
}

// lib/shopify.ts

// Update shipping address on an order
export async function updateOrderShippingAddress(
  orderNumber: string,
  newAddress: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
) {
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;

  console.log('📍 Updating shipping address for:', normalized);

  // First, find the order and check if it can be modified
  const findQuery = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            displayFulfillmentStatus
            cancelledAt
            shippingAddress {
              address1
              address2
              city
              province
              zip
              country
            }
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
    return { success: false, error: `Order ${normalized} has been cancelled` };
  }

  if (order.displayFulfillmentStatus === 'FULFILLED') {
    return { 
      success: false, 
      error: `Order ${normalized} has already been shipped. We cannot change the address once an order is in transit.`,
      suggestion: "Please contact the shipping carrier directly to redirect the package."
    };
  }

  if (order.displayFulfillmentStatus === 'IN_PROGRESS') {
    return { 
      success: false, 
      error: `Order ${normalized} is currently being prepared for shipment. The address may not be changeable at this point.`,
      suggestion: "Please contact support immediately at support@techgearsnowboards.com"
    };
  }

  // Update the shipping address using GraphQL mutation
  const updateMutation = `
    mutation orderUpdate($input: OrderInput!) {
      orderUpdate(input: $input) {
        order {
          id
          name
          shippingAddress {
            address1
            address2
            city
            province
            zip
            country
            firstName
            lastName
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: order.id,
      shippingAddress: {
        address1: newAddress.address1,
        address2: newAddress.address2 || "",
        city: newAddress.city,
        provinceCode: newAddress.province,
        zip: newAddress.zip,
        countryCode: newAddress.country,
        firstName: newAddress.firstName || "",
        lastName: newAddress.lastName || "",
        phone: newAddress.phone || "",
      },
    },
  };

  console.log('📤 Sending address update:', variables);

  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query: updateMutation, variables }),
    }
  );

  const result = await response.json();
  console.log('📥 Address update response:', JSON.stringify(result, null, 2));

  // Check for errors
  if (result.errors) {
    return {
      success: false,
      error: result.errors.map((e: any) => e.message).join(', '),
    };
  }

  const userErrors = result.data?.orderUpdate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    return {
      success: false,
      error: userErrors.map((e: any) => e.message).join(', '),
    };
  }

  const updatedOrder = result.data?.orderUpdate?.order;
  
  if (updatedOrder) {
    return {
      success: true,
      orderNumber: updatedOrder.name,
      message: `Shipping address updated successfully!`,
      newAddress: updatedOrder.shippingAddress,
    };
  }

  return {
    success: false,
    error: 'Unexpected error updating address',
  };
}