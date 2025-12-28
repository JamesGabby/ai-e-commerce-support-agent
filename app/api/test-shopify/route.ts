// app/api/test-shopify/route.ts
import { searchProducts } from '@/lib/shopify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'snowboard';

  try {
    const products = await searchProducts(query);
    return Response.json({ 
      success: true, 
      query,
      count: products.length,
      products 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}