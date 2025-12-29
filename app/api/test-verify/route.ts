// app/api/test-verify/route.ts
import { shopifyAdminRequest } from '@/lib/shopify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order') || '1002';
  const email = searchParams.get('email') || '';
  
  const normalized = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
  
  const query = `
    {
      orders(first: 1, query: "name:${normalized}") {
        edges {
          node {
            id
            name
            email
            customer {
              id
              email
              firstName
              lastName
            }
            billingAddress {
              firstName
              lastName
            }
            shippingAddress {
              firstName
              lastName
            }
          }
        }
      }
    }
  `;

  const result = await shopifyAdminRequest(query);
  
  return Response.json({ 
    success: true,
    rawResult: result,
    order: result?.data?.orders?.edges?.[0]?.node,
    providedEmail: email,
  });
}