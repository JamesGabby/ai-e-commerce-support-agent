// lib/ai/tools/get-product-details.ts
import { tool } from "ai";
import { z } from "zod";
import { shopifyAdminRequest } from "@/lib/shopify";

export const getProductDetails = tool({
  description:
    "Get detailed information about a specific product including sizes, colors, specs, and availability. " +
    "Use this when a customer asks about product details, specifications, sizes, or colors.",
  inputSchema: z.object({
    productTitle: z
      .string()
      .describe("The name/title of the product to get details for"),
  }),
  execute: async (input): Promise<any> => {
    const { productTitle } = input;

    try {
      // Query with metafields included
      const query = `
        {
          products(first: 1, query: "title:*${productTitle.replace(/['"]/g, "")}*") {
            edges {
              node {
                id
                title
                description
                handle
                productType
                tags
                vendor
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                totalInventory
                options {
                  name
                  values
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      price
                      availableForSale
                      inventoryQuantity
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
                featuredImage {
                  url
                }
                # Fetch ALL metafields
                metafields(first: 25) {
                  edges {
                    node {
                      namespace
                      key
                      value
                      type
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const data = await shopifyAdminRequest(query);
      const product = data?.data?.products?.edges?.[0]?.node;

      if (!product) {
        return {
          found: false,
          message: `Could not find product "${productTitle}"`,
        };
      }

      // Parse metafields into readable format
      const specifications = parseMetafields(product.metafields?.edges || []);

      // Check for real variants vs just "Default Title"
      const variants = product.variants.edges.map((v: any) => v.node);
      const hasRealVariants = variants.some(
        (v: any) => v.title !== "Default Title"
      );

      // Get variant options if they exist
      const variantOptions: Record<string, string[]> = {};
      for (const option of product.options || []) {
        if (option.name !== "Title") {
          variantOptions[option.name] = option.values;
        }
      }

      return {
        found: true,
        product: {
          title: product.title,
          description: product.description,
          productType: product.productType,
          vendor: product.vendor,
          tags: product.tags,
          price: `$${parseFloat(product.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
          priceRange:
            product.priceRangeV2.minVariantPrice.amount !==
            product.priceRangeV2.maxVariantPrice.amount
              ? {
                  min: `$${parseFloat(product.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
                  max: `$${parseFloat(product.priceRangeV2.maxVariantPrice.amount).toFixed(2)}`,
                }
              : null,
          inStock: product.totalInventory > 0,
          stockCount: product.totalInventory,
          image: product.featuredImage?.url,
        },
        // Product specifications from metafields
        specifications,
        // Variant options (if any)
        hasVariants: hasRealVariants,
        variantOptions: hasRealVariants ? variantOptions : null,
        variants: hasRealVariants
          ? variants
              .filter((v: any) => v.title !== "Default Title")
              .map((v: any) => ({
                name: v.title,
                price: `$${parseFloat(v.price).toFixed(2)}`,
                inStock: v.availableForSale,
                stockCount: v.inventoryQuantity,
              }))
          : null,
      };
    } catch (error) {
      console.error("Error fetching product details:", error);
      return {
        found: false,
        message: "Error fetching product details. Please try again.",
      };
    }
  },
});

function parseMetafields(
  metafieldEdges: any[]
): Record<string, string | string[]> {
  const specs: Record<string, string | string[]> = {};

  for (const edge of metafieldEdges) {
    const { namespace, key, value, type } = edge.node;

    // Create readable key name
    const readableKey = formatMetafieldKey(key);

    // Parse value based on type
    let parsedValue: string | string[];

    try {
      if (type === "list.single_line_text_field" || type === "list.metaobject_reference") {
        // Handle list/array values
        const parsed = JSON.parse(value);
        parsedValue = Array.isArray(parsed) ? parsed : [value];
      } else if (type === "single_line_text_field" || type === "number_integer" || type === "number_decimal") {
        parsedValue = value;
      } else if (type === "boolean") {
        parsedValue = value === "true" ? "Yes" : "No";
      } else if (type === "json") {
        const parsed = JSON.parse(value);
        parsedValue = typeof parsed === "object" ? JSON.stringify(parsed) : parsed;
      } else {
        // Default: use raw value
        parsedValue = value;
      }
    } catch {
      parsedValue = value;
    }

    // Skip empty values
    if (!parsedValue || (Array.isArray(parsedValue) && parsedValue.length === 0)) {
      continue;
    }

    specs[readableKey] = parsedValue;
  }

  return specs;
}

function formatMetafieldKey(key: string): string {
  // Convert snake_case or kebab-case to Title Case
  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}