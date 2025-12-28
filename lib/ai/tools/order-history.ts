// lib/ai/tools/order-history.ts
import { tool } from "ai";
import { z } from "zod";
import { getOrdersByCustomerEmail } from "@/lib/shopify";

export const getOrderHistory = tool({
  description:
    "Get a customer's order history by their email address. Returns their recent orders with status.",
  inputSchema: z.object({
    email: z
      .string()
      .email()
      .describe("The customer's email address"),
    limit: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Number of orders to return (default 5, max 10)"),
  }),
  execute: async (input) => {
    try {
      const orders = await getOrdersByCustomerEmail(input.email, input.limit || 5);

      if (!orders || orders.length === 0) {
        return {
          found: false,
          message: `No orders found for ${input.email}`,
        };
      }

      return {
        found: true,
        email: input.email,
        orderCount: orders.length,
        orders: orders.map((order: any) => ({
          orderNumber: order.name,
          date: order.createdAt,
          status: order.displayFinancialStatus,
          fulfillment: order.displayFulfillmentStatus || "Unfulfilled",
          total: order.totalPriceSet.shopMoney,
        })),
      };
    } catch (error) {
      return {
        found: false,
        message: "Error fetching order history. Please try again.",
      };
    }
  },
});