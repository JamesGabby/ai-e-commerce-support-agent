// lib/ai/tools/search-products.ts
import { tool } from "ai";
import { z } from "zod";
import { searchProducts } from "@/lib/shopify";

// Define consistent return type
interface SearchResult {
  found: boolean;
  message?: string;
  suggestions?: string[];
  searchTerm?: string;
  resultCount?: number;
  products?: Array<{
    id: string;
    title: string;
    description: string;
    productType: string;
    price: { amount: string; currencyCode: string };
    priceRange: {
      min: { amount: string; currencyCode: string };
      max: { amount: string; currencyCode: string };
    };
    inStock: boolean;
    inventory: number;
    image: string | undefined;
    handle: string;
    variants: Array<{
      id: string;
      name: string;
      price: string;
      available: boolean;
      stock: number;
      options: Array<{ name: string; value: string }>;
    }>;
  }>;
}

export const searchProductCatalog = tool({
  description:
    "Search for products in the store by name, category, or keyword. " +
    "Use this when customers ask about products, availability, or pricing. " +
    "Can handle multi-word queries like 'women's snowboards' or 'red winter jacket'.",
  inputSchema: z.object({
    searchTerm: z
      .string()
      .describe("The product name, category, or keywords to search for"),
    includeOutOfStock: z
      .boolean()
      .optional()
      .describe("Whether to include out-of-stock products in results"),
  }),
  execute: async (input): Promise<SearchResult> => {
    const { searchTerm, includeOutOfStock = true } = input;

    try {
      const products = await searchProducts(searchTerm, {
        limit: 10,
        includeOutOfStock,
      });

      if (!products || products.length === 0) {
        return {
          found: false,
          message: `No products found matching "${searchTerm}". Try different keywords or browse categories.`,
          suggestions: generateSearchSuggestions(searchTerm),
        };
      }

      return {
        found: true,
        searchTerm,
        resultCount: products.length,
        products: products.map((product: any) => ({
          id: product.id,
          title: product.title,
          description:
            product.description?.substring(0, 200) +
              (product.description?.length > 200 ? "..." : "") ||
            "No description",
          productType: product.productType || "",
          price: product.priceRangeV2.minVariantPrice,
          priceRange: {
            min: product.priceRangeV2.minVariantPrice,
            max: product.priceRangeV2.maxVariantPrice,
          },
          inStock: product.totalInventory > 0,
          inventory: product.totalInventory,
          image: product.featuredImage?.url,
          handle: product.handle,
          variants: product.variants.edges.map((v: any) => ({
            id: v.node.id,
            name: v.node.title,
            price: v.node.price,
            available: v.node.availableForSale,
            stock: v.node.inventoryQuantity,
            options: v.node.selectedOptions || [],
          })),
        })),
      };
    } catch (error) {
      console.error("Product search error:", error);
      return {
        found: false,
        message: "Error searching products. Please try again.",
      };
    }
  },
});

function generateSearchSuggestions(searchTerm: string): string[] {
  const tokens = searchTerm.toLowerCase().split(/\s+/);
  const suggestions: string[] = [];

  if (tokens.length > 1) {
    suggestions.push(...tokens.filter((t) => t.length > 2));
  }

  const categoryMap: Record<string, string[]> = {
    women: ["women's apparel", "ladies", "female", "women", "girls", "womens", "women's"],
    men: ["men's apparel", "mens", "male", "men", "boys", "men's"],
    snowboard: ["snowboards", "snow gear", "winter sports", "boards", "snowboarding", "snowboard"],
    ski: ["skis", "skiing", "ski gear"],
  };

  for (const token of tokens) {
    if (categoryMap[token]) {
      suggestions.push(...categoryMap[token]);
    }
  }

  return [...new Set(suggestions)].slice(0, 5);
}