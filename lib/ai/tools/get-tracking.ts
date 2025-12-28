// lib/ai/tools/get-tracking.ts
import { tool } from "ai";
import { z } from "zod";
import { getOrderWithTracking } from "@/lib/shopify";

export const getTrackingInfo = tool({
  description:
    "Get shipping and tracking information for an order. Use this when customers ask where their order is or want tracking details.",
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number (e.g., #1001 or 1001)"),
  }),
  execute: async (input) => {
    try {
      const order = await getOrderWithTracking(input.orderNumber);

      if (!order) {
        return {
          found: false,
          message: `Order ${input.orderNumber} not found.`,
        };
      }

      const fulfillment = order.fulfillments?.[0];

      return {
        found: true,
        orderNumber: order.name,
        fulfillmentStatus: order.displayFulfillmentStatus || "Unfulfilled",
        shippingAddress: order.shippingAddress
          ? `${order.shippingAddress.city}, ${order.shippingAddress.province}, ${order.shippingAddress.country} ${order.shippingAddress.zip}`
          : "Not provided",
        tracking: fulfillment
          ? {
              carrier: fulfillment.trackingInfo?.[0]?.company || "Not available",
              trackingNumber: fulfillment.trackingInfo?.[0]?.number || "Not available",
              trackingUrl: fulfillment.trackingInfo?.[0]?.url || null,
              status: fulfillment.status,
              shippedAt: fulfillment.createdAt,
              estimatedDelivery: fulfillment.estimatedDeliveryAt || "Not available",
              deliveredAt: fulfillment.deliveredAt || null,
            }
          : {
              message: "Order has not been shipped yet",
            },
      };
    } catch (error) {
      return {
        found: false,
        message: "Error fetching tracking info. Please try again.",
      };
    }
  },
});