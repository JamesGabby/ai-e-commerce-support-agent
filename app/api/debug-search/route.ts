// app/api/debug-search/route.ts
import { debugSearch } from "@/lib/shopify/debug-search";
import { NextResponse } from "next/server";

export async function GET() {
  await debugSearch();
  return NextResponse.json({ message: "Check server console for output" });
}