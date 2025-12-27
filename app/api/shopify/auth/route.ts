// app/api/shopify/auth/route.ts
import { redirect } from 'next/navigation';

export async function GET() {
  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const shop = process.env.SHOPIFY_STORE_DOMAIN!;
  const redirectUri = `http://localhost:3000/api/shopify/callback`;
  const scopes = 'read_orders,read_customers,read_fulfillments,read_products';
  const state = crypto.randomUUID(); // For security

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
    }).toString();

  redirect(authUrl);
}