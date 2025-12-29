// lib/ai/tools/verify-customer.ts
import { tool } from "ai";
import { z } from "zod";
import { verifyOrderOwnership } from "@/lib/shopify";

export const verifyCustomer = tool({
  description: `Verify a customer's identity by checking if their email matches an order. 
    Use this FIRST before any sensitive actions like cancellation.
    After verification succeeds, THEN ask for confirmation before cancelling.`,
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number"),
    customerEmail: z
      .string()
      .email()
      .describe("The email address provided by the customer"),
  }),
  execute: async (input) => {
    console.log("🔐 verifyCustomer called:", input.orderNumber, input.customerEmail);

    const verification = await verifyOrderOwnership(input.orderNumber, input.customerEmail);
    
    if (!verification.verified) {
      return {
        verified: false,
        message: `Sorry, the email "${input.customerEmail}" doesn't match our records for order ${input.orderNumber}. Please check and try again.`,
      };
    }

    const order = verification.order;
    
    return {
      verified: true,
      orderNumber: order.name,
      status: order.displayFinancialStatus,
      fulfillment: order.displayFulfillmentStatus || "Unfulfilled",
      canCancel: !order.cancelledAt && order.displayFulfillmentStatus !== 'FULFILLED',
      message: `Verified! Order ${order.name} (${order.displayFinancialStatus}, ${order.displayFulfillmentStatus || "Unfulfilled"})`,
    };
  },
});