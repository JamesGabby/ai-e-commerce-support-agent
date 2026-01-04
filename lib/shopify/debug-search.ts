// lib/shopify/debug-search.ts
import { shopifyAdminRequest } from "../shopify";

export async function debugSearch() {
  console.log("\n========== SHOPIFY DEBUG ==========\n");

  // Test 1: Get ALL products (no filter)
  console.log("TEST 1: Fetching ALL products...");
  const allProductsQuery = `
    {
      products(first: 50) {
        edges {
          node {
            id
            title
            status
            publishedAt
            description
            tags
            productType
          }
        }
      }
    }
  `;

  try {
    const allData = await shopifyAdminRequest(allProductsQuery);
    const allProducts = allData?.data?.products?.edges?.map((e: any) => e.node) || [];
    
    console.log(`Found ${allProducts.length} total products:\n`);
    allProducts.forEach((p: any, i: number) => {
      console.log(`${i + 1}. "${p.title}"`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Published: ${p.publishedAt || "NOT PUBLISHED"}`);
      console.log(`   Tags: ${p.tags?.join(", ") || "none"}`);
      console.log(`   Type: ${p.productType || "none"}`);
      console.log(`   Has "women" in title: ${p.title?.toLowerCase().includes("women")}`);
      console.log(`   Has "women" in desc: ${p.description?.toLowerCase().includes("women")}`);
      console.log("");
    });
  } catch (error) {
    console.error("TEST 1 FAILED:", error);
  }

  // Test 2: Search for "snowboard"
  console.log("\n--- TEST 2: Search for 'snowboard' ---");
  const snowboardQuery = `
    {
      products(first: 20, query: "snowboard") {
        edges {
          node {
            id
            title
            status
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminRequest(snowboardQuery);
    const products = data?.data?.products?.edges?.map((e: any) => e.node) || [];
    console.log(`Found ${products.length} products for "snowboard":`);
    products.forEach((p: any) => console.log(`  - ${p.title} (${p.status})`));
  } catch (error) {
    console.error("TEST 2 FAILED:", error);
  }

  // Test 3: Search for "women"
  console.log("\n--- TEST 3: Search for 'women' ---");
  const womenQuery = `
    {
      products(first: 20, query: "women") {
        edges {
          node {
            id
            title
            status
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminRequest(womenQuery);
    const products = data?.data?.products?.edges?.map((e: any) => e.node) || [];
    console.log(`Found ${products.length} products for "women":`);
    products.forEach((p: any) => console.log(`  - ${p.title} (${p.status})`));
  } catch (error) {
    console.error("TEST 3 FAILED:", error);
  }

  // Test 4: Search for "Rome Royal" specifically
  console.log("\n--- TEST 4: Search for 'Rome Royal' ---");
  const romeQuery = `
    {
      products(first: 20, query: "Rome Royal") {
        edges {
          node {
            id
            title
            status
            publishedAt
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminRequest(romeQuery);
    const products = data?.data?.products?.edges?.map((e: any) => e.node) || [];
    console.log(`Found ${products.length} products for "Rome Royal":`);
    products.forEach((p: any) => {
      console.log(`  - ${p.title} (${p.status}, published: ${p.publishedAt || "NO"})`);
    });
  } catch (error) {
    console.error("TEST 4 FAILED:", error);
  }

  // Test 5: Search by tag
  console.log("\n--- TEST 5: Search by tag 'women' ---");
  const tagQuery = `
    {
      products(first: 20, query: "tag:women") {
        edges {
          node {
            id
            title
            status
            tags
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminRequest(tagQuery);
    const products = data?.data?.products?.edges?.map((e: any) => e.node) || [];
    console.log(`Found ${products.length} products with tag "women":`);
    products.forEach((p: any) => console.log(`  - ${p.title} (tags: ${p.tags?.join(", ")})`));
  } catch (error) {
    console.error("TEST 5 FAILED:", error);
  }

  console.log("\n========== END DEBUG ==========\n");
}