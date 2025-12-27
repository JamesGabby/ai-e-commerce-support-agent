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