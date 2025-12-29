// lib/ai/tools/cancel-order.ts
import { tool } from "ai";
import { z } from "zod";
import { cancelOrder, verifyOrderOwnership } from "@/lib/shopify";

export const cancelOrderTool = tool({
  description: `Cancel a Shopify order. STRICT REQUIREMENTS:
    1. You MUST have the customer's email BEFORE calling this tool
    2. You MUST ask the customer for their email if they haven't provided it
    3. You MUST get explicit confirmation ("yes, cancel my order") before setting customerConfirmed to true
    4. NEVER assume or guess the email - always ask the customer
    DO NOT call this tool until you have: orderNumber, customerEmail, and customerConfirmed=true`,
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number to cancel (e.g., #1001 or 1001)"),
    customerEmail: z
      .string()
      .email()
      .describe("Customer's email address - MUST be provided by the customer, never assumed"),
    reason: z
      .string()
      .optional()
      .describe("Reason for cancellation"),
    customerConfirmed: z
      .boolean()
      .describe("ONLY set to true if customer explicitly said 'yes cancel' or similar confirmation"),
  }),
  execute: async (input) => {
    console.log("🚫 cancelOrderTool called:", JSON.stringify(input, null, 2));

    // Validate we have email
    if (!input.customerEmail) {
      return {
        success: false,
        error: "STOP: Customer email is required. Ask the customer for their email address before proceeding.",
      };
    }

    // Step 1: Verify email matches the order
    const verification = await verifyOrderOwnership(input.orderNumber, input.customerEmail);
    
    if (!verification.verified) {
      console.log("❌ Verification failed:", verification.reason);
      return {
        success: false,
        verified: false,
        error: verification.reason,
      };
    }

    console.log("✅ Email verified for order:", input.orderNumber);

    // Step 2: Check if order can be cancelled
    const order = verification.order;
    
    if (order.cancelledAt) {
      return {
        success: false,
        verified: true,
        error: `Order ${order.name} has already been cancelled.`,
      };
    }

    if (order.displayFulfillmentStatus === 'FULFILLED') {
      return {
        success: false,
        verified: true,
        error: `Order ${order.name} has already been shipped and cannot be cancelled. Please initiate a return instead.`,
      };
    }

    // Step 3: Require explicit confirmation
    if (!input.customerConfirmed) {
      console.log("⚠️ Awaiting customer confirmation");
      return {
        success: false,
        verified: true,
        needsConfirmation: true,
        orderNumber: order.name,
        message: `I verified your email. Order ${order.name} is ready to be cancelled. Please confirm by saying "Yes, cancel my order". This will refund your payment and cannot be undone.`,
      };
    }

    // Step 4: Cancel the order
    console.log("🚀 Proceeding with cancellation");
    
    try {
      const result = await cancelOrder(input.orderNumber, input.reason || "Customer request");

      if (result.success) {
        console.log("✅ Order cancelled successfully");
        return {
          success: true,
          verified: true,
          cancelled: true,
          orderNumber: result.orderNumber,
          message: `Order ${result.orderNumber} has been cancelled. You'll receive a confirmation email and refund within 5-10 business days.`,
        };
      } else {
        return {
          success: false,
          verified: true,
          cancelled: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("❌ cancelOrderTool error:", error);
      return {
        success: false,
        error: "Something went wrong. Please contact support.",
      };
    }
  },
});