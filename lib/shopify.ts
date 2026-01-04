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

interface SearchOptions {
  limit?: number;
  includeOutOfStock?: boolean;
}

interface ScoredProduct {
  product: any;
  score: number;
}

export async function searchProducts(
  searchTerm: string,
  options: SearchOptions = {}
): Promise<any[]> {
  const { limit = 10, includeOutOfStock = true } = options;

  const tokens = tokenizeSearchTerm(searchTerm);

  if (tokens.length === 0) {
    return [];
  }

  console.log(`[Search] Tokens: ${tokens.join(", ")}`);

  // Search for each token separately and combine results
  const searchPromises = tokens.map((token) =>
    executeProductQuery(token, limit * 3)
  );

  const results = await Promise.all(searchPromises);
  const allProducts = results.flat();
  const uniqueProducts = deduplicateProducts(allProducts);

  console.log(`[Search] Found ${uniqueProducts.length} unique products`);

  // Score products based on how many tokens they match
  const scoredProducts = scoreProducts(uniqueProducts, tokens);
  const relevantProducts = scoredProducts.filter((sp) => sp.score > 0);

  // Sort by score (highest first)
  let finalResults = relevantProducts
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.product);

  if (!includeOutOfStock) {
    finalResults = finalResults.filter((p) => p.totalInventory > 0);
  }

  console.log(`[Search] Returning ${Math.min(finalResults.length, limit)} products`);

  return finalResults.slice(0, limit);
}

function tokenizeSearchTerm(searchTerm: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "for", "to", "in", "on",
    "do", "you", "have", "any", "some", "your", "i", "want", "looking",
  ]);

  let normalized = searchTerm.toLowerCase();

  // Handle possessives: "women's" -> "women"
  normalized = normalized.replace(/'s\b/g, "");
  normalized = normalized.replace(/[']/g, "");

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .map((token) => singularize(token)); // Convert plurals to singular

  return [...new Set(tokens)]; // Remove duplicates
}

// Simple singularization for common cases
function singularize(word: string): string {
  // Common irregular plurals
  const irregulars: Record<string, string> = {
    women: "women", // Keep as-is (it's already the search term we want)
    men: "men",
    children: "child",
    skis: "ski",
    goggles: "goggles", // Keep as-is
  };

  if (irregulars[word]) {
    return irregulars[word];
  }

  // Standard rules
  if (word.endsWith("ies") && word.length > 4) {
    return word.slice(0, -3) + "y"; // "accessories" -> "accessory"
  }
  if (word.endsWith("es") && word.length > 3) {
    // "boxes" -> "box", "watches" -> "watch"
    if (word.endsWith("shes") || word.endsWith("ches") || word.endsWith("xes") || word.endsWith("ses")) {
      return word.slice(0, -2);
    }
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1); // "snowboards" -> "snowboard"
  }

  return word;
}

async function executeProductQuery(
  searchTerm: string,
  limit: number
): Promise<any[]> {
  // Simple query - let Shopify do the matching
  // Don't use wildcards - Shopify handles partial matching automatically
  const graphqlQuery = `
    {
      products(first: ${limit}, query: "${escapeShopifyQuery(searchTerm)}") {
        edges {
          node {
            id
            title
            description
            handle
            productType
            tags
            vendor
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            totalInventory
            status
            featuredImage {
              url
              altText
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  availableForSale
                  inventoryQuantity
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminRequest(graphqlQuery);
    const products = data?.data?.products?.edges?.map((e: any) => e.node) || [];
    console.log(`[Search] Query "${searchTerm}" returned ${products.length} products`);
    return products;
  } catch (error) {
    console.error(`[Search] Error:`, error);
    return [];
  }
}

function escapeShopifyQuery(term: string): string {
  return term.replace(/[\\:"'()]/g, "\\$&");
}

function deduplicateProducts(products: any[]): any[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

function scoreProducts(products: any[], tokens: string[]): ScoredProduct[] {
  return products.map((product) => {
    let score = 0;
    const titleLower = product.title?.toLowerCase() || "";
    const descLower = product.description?.toLowerCase() || "";
    const typeLower = product.productType?.toLowerCase() || "";
    const tagsLower = (product.tags || []).join(" ").toLowerCase();

    // Combine all searchable text
    const allText = `${titleLower} ${descLower} ${typeLower} ${tagsLower}`;

    const matchedTokens: string[] = [];

    for (const token of tokens) {
      // Check if token appears in ANY field
      if (allText.includes(token)) {
        matchedTokens.push(token);

        // Add score based on WHERE it matched
        if (titleLower.includes(token)) score += 15;
        if (typeLower.includes(token)) score += 10;
        if (tagsLower.includes(token)) score += 10;
        if (descLower.includes(token)) score += 5;
      }
    }

    // CRITICAL: For multi-token searches, REQUIRE all tokens to match
    if (tokens.length > 1 && matchedTokens.length < tokens.length) {
      // Not all tokens matched - exclude this product
      console.log(`[Score] "${product.title}" excluded (matched ${matchedTokens.length}/${tokens.length}: ${matchedTokens.join(", ")})`);
      return { product, score: 0 };
    }

    // Bonus for matching all tokens
    if (matchedTokens.length === tokens.length && tokens.length > 1) {
      score += 30;
    }

    // In stock bonus
    if (product.totalInventory > 0) {
      score += 2;
    }

    if (score > 0) {
      console.log(`[Score] "${product.title}" = ${score} (matched: ${matchedTokens.join(", ")})`);
    }

    return { product, score };
  });
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
    return { success: false as const, error: `Order ${normalized} not found` };
  }

  if (order.cancelledAt) {
    return { success: false as const, error: `Order ${normalized} is already cancelled` };
  }

  if (order.displayFulfillmentStatus === 'FULFILLED') {
    return {
      success: false as const,
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
      success: false as const,
      error: result.errors.map((e: any) => e.message).join(', ')
    };
  }

  const userErrors = result.data?.orderCancel?.orderCancelUserErrors;
  if (userErrors && userErrors.length > 0) {
    return {
      success: false as const,
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
    return { success: false as const, error: `Order ${normalized} not found` };
  }

  if (order.cancelledAt) {
    return { success: false as const, error: `Order ${normalized} has been cancelled` };
  }

  if (order.displayFulfillmentStatus === 'FULFILLED') {
    return {
      success: false as const,
      error: `Order ${normalized} has already been shipped. We cannot change the address once an order is in transit.`,
      suggestion: "Please contact the shipping carrier directly to redirect the package."
    };
  }

  if (order.displayFulfillmentStatus === 'IN_PROGRESS') {
    return {
      success: false as const,
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
      success: false as const,
      error: result.errors.map((e: any) => e.message).join(', '),
    };
  }

  const userErrors = result.data?.orderUpdate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    return {
      success: false as const,
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
    success: false as const,
    error: 'Unexpected error updating address',
  };
}

type LeadCaptureResult =
  | { success: true; customer: any; isNew: boolean }
  | { success: false; error: string };

export async function captureLeadInShopify(leadData: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  note?: string;
  marketingConsent?: boolean;
}): Promise<LeadCaptureResult> {
  console.log('📧 Capturing lead:', leadData.email);

  // First check if customer already exists
  const existingCustomer = await getCustomerByEmail(leadData.email);

  if (existingCustomer) {
    console.log('👤 Customer already exists, updating...');
    return await updateCustomerLead(existingCustomer.id, leadData);
  }

  // Create new customer
  const createMutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          phone
          tags
          note
          createdAt
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
      email: leadData.email,
      firstName: leadData.firstName || "",
      lastName: leadData.lastName || "",
      phone: leadData.phone || "",
      tags: [...(leadData.tags || []), "chatbot-lead", `captured-${new Date().toISOString().split('T')[0]}`],
      note: leadData.note || "Lead captured via chatbot",
      emailMarketingConsent: leadData.marketingConsent ? {
        marketingState: "SUBSCRIBED",
        marketingOptInLevel: "SINGLE_OPT_IN",
        consentUpdatedAt: new Date().toISOString(),
      } : undefined,
    },
  };

  const response = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query: createMutation, variables }),
    }
  );

  const result = await response.json();
  console.log('📥 Lead capture response:', JSON.stringify(result, null, 2));

  if (result.errors) {
    return {
      success: false as const,
      error: result.errors.map((e: any) => e.message).join(', '),
    };
  }

  const userErrors = result.data?.customerCreate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    return {
      success: false as const,
      error: userErrors.map((e: any) => e.message).join(', '),
    };
  }

  return {
    success: true,
    customer: result.data?.customerCreate?.customer,
    isNew: true,
  };
}

// Update existing customer with new lead info
async function updateCustomerLead(
  customerId: string,
  leadData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    note?: string;
    marketingConsent?: boolean;
  }
) {
  const updateMutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          tags
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
      id: customerId,
      firstName: leadData.firstName || undefined,
      lastName: leadData.lastName || undefined,
      phone: leadData.phone || undefined,
      tags: leadData.tags || [],
      note: leadData.note || undefined,
    },
  };

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

  if (result.errors || result.data?.customerUpdate?.userErrors?.length > 0) {
    return {
      success: false as const,
      error: 'Failed to update customer',
    };
  }

  return {
    success: true as const,
    customer: result.data?.customerUpdate?.customer,
    isNew: false,
  };
}