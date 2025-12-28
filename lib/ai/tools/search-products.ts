// lib/ai/tools/search-products.ts
import { tool } from "ai";
import { z } from "zod";
import { searchProducts } from "@/lib/shopify";

export const searchProductCatalog = tool({
  description:
    "Search for products in the store by name or keyword. Use this when customers ask about products, availability, or pricing.",
  inputSchema: z.object({
    searchTerm: z
      .string()
      .describe("The product name or keyword to search for"),
  }),
  execute: async (input) => {
    try {
      const products = await searchProducts(input.searchTerm);

      if (!products || products.length === 0) {
        return {
          found: false,
          message: `No products found matching "${input.searchTerm}"`,
        };
      }

      return {
        found: true,
        searchTerm: input.searchTerm,
        resultCount: products.length,
        products: products.map((product: any) => ({
          title: product.title,
          description: product.description?.substring(0, 150) + '...' || 'No description',
          price: product.priceRangeV2.minVariantPrice,
          inStock: product.totalInventory > 0,
          inventory: product.totalInventory,
          variants: product.variants.edges.map((v: any) => ({
            name: v.node.title,
            price: v.node.price,
            available: v.node.availableForSale,
            stock: v.node.inventoryQuantity,
          })),
        })),
      };
    } catch (error) {
      return {
        found: false,
        message: "Error searching products. Please try again.",
      };
    }
  },
});