// app/api/test-shopify/route.ts
import { shopifyAdminRequest, getOrderByNumber } from '@/lib/shopify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order') || '#1001';

  try {
    // Test 1: Get all orders (raw response)
    const allOrders = await shopifyAdminRequest(`
      {
        orders(first: 10) {
          edges {
            node {
              id
              name
              email
              createdAt
            }
          }
        }
      }
    `);

    // Test 2: Try to find specific order
    const specificOrder = await getOrderByNumber(orderNumber);

    return Response.json({ 
      success: true, 
      allOrdersRaw: allOrders,
      searchedFor: orderNumber,
      foundOrder: specificOrder,
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}