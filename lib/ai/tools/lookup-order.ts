import { tool } from "ai";
import { z } from "zod";
import { getOrderByNumber } from "@/lib/shopify";

export const lookupOrder = tool({
  description:
    "Look up a Shopify order by order number (e.g., #1001 or 1001). Use this when a customer asks about their order status, tracking, or order details.",
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number to look up (e.g., #1001 or 1001)"),
  }),
  execute: async (input) => {
    try {
      const order = await getOrderByNumber(input.orderNumber);

      if (!order) {
        return {
          found: false,
          message: `Order ${input.orderNumber} not found. Please verify the order number.`,
        };
      }

      return {
        found: true,
        orderNumber: order.name,
        email: order.email,
        status: order.displayFinancialStatus,
        fulfillment: order.displayFulfillmentStatus || "Unfulfilled",
        total: order.totalPriceSet.shopMoney,
        items: order.lineItems.edges.map((e: any) => ({
          title: e.node.title,
          quantity: e.node.quantity,
        })),
        createdAt: order.createdAt,
      };
    } catch (error) {
      return {
        found: false,
        message: "Error looking up order. Please try again.",
      };
    }
  },
});