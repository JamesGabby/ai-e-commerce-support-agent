import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const shop = process.env.SHOPIFY_STORE_DOMAIN!;

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      // In production, show the token so you can add it to Vercel env vars
      // IMPORTANT: Remove this in final production - just for initial setup
      return NextResponse.json({ 
        success: true, 
        message: 'Add this token to your Vercel environment variables as SHOPIFY_ACCESS_TOKEN',
        token: data.access_token,
        instructions: [
          '1. Copy the token above',
          '2. Go to Vercel Dashboard → Settings → Environment Variables',
          '3. Add/Update SHOPIFY_ACCESS_TOKEN with this value',
          '4. Redeploy your app'
        ]
      });
    }

    return NextResponse.json({ error: 'Failed to get token', details: data }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'OAuth failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}