// lib/ai/tools/lookup-order.ts
import { tool } from "ai";
import { z } from "zod";
import { getOrderByNumber, verifyOrderOwnership } from "@/lib/shopify";

export const lookupOrder = tool({
  description:
    "Look up a Shopify order by order number. For full order details, customer email is required for verification. Can do basic lookup without email.",
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number to look up (e.g., #1001 or 1001)"),
    customerEmail: z
      .string()
      .email()
      .optional()
      .describe("Customer's email for verification (required for full details)"),
  }),
  execute: async (input) => {
    console.log("🔍 lookupOrder called:", input.orderNumber);

    // If email provided, verify ownership for full details
    if (input.customerEmail) {
      const verification = await verifyOrderOwnership(input.orderNumber, input.customerEmail);
      
      if (!verification.verified) {
        return {
          found: false,
          verified: false,
          message: `I couldn't verify your identity. Please check that the email address matches the one used for order ${input.orderNumber}.`,
        };
      }

      const order = verification.order;
      return {
        found: true,
        verified: true,
        orderNumber: order.name,
        email: order.email,
        status: order.displayFinancialStatus,
        fulfillment: order.displayFulfillmentStatus || "Unfulfilled",
      };
    }

    // Basic lookup without email (limited info)
    const order = await getOrderByNumber(input.orderNumber);
    
    if (!order) {
      return {
        found: false,
        message: `Order ${input.orderNumber} not found. Please check the order number.`,
      };
    }

    return {
      found: true,
      verified: false,
      orderNumber: order.name,
      status: order.displayFinancialStatus,
      fulfillment: order.displayFulfillmentStatus || "Unfulfilled",
      message: "For full order details and to make changes, please provide the email address associated with this order.",
    };
  },
});