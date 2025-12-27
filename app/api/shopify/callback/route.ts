// app/api/shopify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

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
      // Save token to .env.local (for development)
      // In production, use a database
      console.log('=================================');
      console.log('ACCESS TOKEN:', data.access_token);
      console.log('=================================');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Token received! Check your terminal.',
        token: data.access_token 
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