// lib/ai/tools/request-return.ts
import { tool } from "ai";
import { z } from "zod";
import { verifyOrderOwnership, getOrderByNumber } from "@/lib/shopify";

export const requestReturn = tool({
  description: `Initiate a return or exchange request for an order. 
    REQUIRES: customer verification via email before processing.
    Use when customer wants to return items, exchange sizes, or report issues with products.`,
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number for the return"),
    customerEmail: z
      .string()
      .email()
      .describe("Customer's email for verification"),
    items: z.array(z.object({
      productName: z
        .string()
        .describe("Name of the product to return"),
      reason: z
        .string()
        .describe("Reason: wrong_size, defective, not_as_described, changed_mind, arrived_damaged, other"),
      action: z
        .string()
        .describe("What customer wants: refund or exchange"),
      exchangeDetails: z
        .string()
        .optional()
        .describe("For exchanges: new size or color wanted"),
      additionalNotes: z
        .string()
        .optional()
        .describe("Any additional details about the issue"),
    })),
    customerConfirmed: z
      .boolean()
      .describe("Customer has confirmed they want to proceed with return"),
  }),
  execute: async (input) => {
    console.log("📦 requestReturn called:", JSON.stringify(input, null, 2));

    // Step 1: Verify customer owns this order
    const verification = await verifyOrderOwnership(input.orderNumber, input.customerEmail);
    
    if (!verification.verified) {
      console.log("❌ Return verification failed:", verification.reason);
      return {
        success: false,
        error: verification.reason,
        message: "I couldn't verify your identity. Please check your order number and email address.",
      };
    }

    console.log("✅ Customer verified for return");

    const order = verification.order;

    // Step 2: Check if order is eligible for return
    // Must be fulfilled (shipped) to return
    if (order.displayFulfillmentStatus !== 'FULFILLED') {
      return {
        success: false,
        error: "Order not yet delivered",
        message: `Order ${order.name} hasn't been delivered yet (Status: ${order.displayFulfillmentStatus || 'Unfulfilled'}). You can cancel the order instead, or wait until it arrives to request a return.`,
        suggestion: "Would you like to cancel this order instead?",
      };
    }

    // Step 3: Check return window (30 days)
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder > 30) {
      return {
        success: false,
        error: "Return window expired",
        message: `Unfortunately, order ${order.name} is outside our 30-day return window (ordered ${daysSinceOrder} days ago). However, if you're experiencing a product defect, you may be eligible for a warranty claim.`,
        suggestion: "Would you like to submit a warranty claim instead?",
      };
    }

    // Step 4: Require confirmation
    if (!input.customerConfirmed) {
      const itemSummary = input.items.map(item => 
        `- ${item.productName}: ${item.action}${item.exchangeDetails ? ` (${item.exchangeDetails})` : ''}`
      ).join('\n');

      return {
        success: false,
        needsConfirmation: true,
        orderNumber: order.name,
        daysRemaining: 30 - daysSinceOrder,
        message: `Here's your return request summary for order ${order.name}:\n\n${itemSummary}\n\nPlease confirm by saying "Yes, submit my return" to proceed.`,
      };
    }

    // Step 5: Create the return request
    const returnId = `RET-${Date.now()}`;
    
    console.log("🎫 Creating return:", returnId);

    // In production, you would:
    // - Create return in Shopify (if using Shopify returns)
    // - Or create in your returns management system
    // - Or send to support ticket system
    // - Or trigger email to fulfillment team

    const hasExchange = input.items.some(item => item.action === 'exchange');
    const hasRefund = input.items.some(item => item.action === 'refund');

    return {
      success: true,
      returnId,
      orderNumber: order.name,
      message: `Return request ${returnId} has been created!`,
      items: input.items.map(item => ({
        product: item.productName,
        reason: formatReason(item.reason),
        action: item.action,
        exchangeDetails: item.exchangeDetails,
      })),
      nextSteps: [
        "📧 You'll receive a return shipping label via email within 24 hours",
        "📦 Pack items in original packaging (if available)",
        "🏷️ Attach the prepaid return label to your package",
        "📮 Drop off at any UPS location",
        hasRefund ? "💰 Refunds processed within 5-7 business days of receiving items" : null,
        hasExchange ? "🔄 Exchanges shipped within 2-3 business days of receiving items" : null,
      ].filter(Boolean),
      returnPolicy: {
        window: "30 days from delivery",
        condition: "Items must be unused with original tags",
        exceptions: "Mounted bindings and used gear cannot be returned",
      },
      supportEmail: "support@techgearsnowboards.com",
    };
  },
});

// Helper function to format reason
function formatReason(reason: string): string {
  const reasons: Record<string, string> = {
    wrong_size: "Wrong size",
    defective: "Product defect",
    not_as_described: "Not as described",
    changed_mind: "Changed mind",
    arrived_damaged: "Arrived damaged",
    other: "Other reason",
  };
  return reasons[reason] || reason;
}