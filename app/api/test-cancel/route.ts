// app/api/test-cancel/route.ts
import { cancelOrder } from '@/lib/shopify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order') || '1001';

  console.log('🧪 Testing cancel for order:', orderNumber);

  try {
    const result = await cancelOrder(orderNumber, 'customer');
    
    return Response.json({ 
      success: result.success,
      result 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}