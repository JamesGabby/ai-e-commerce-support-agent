// lib/ai/tools/update-shipping-address.ts
import { tool } from "ai";
import { z } from "zod";
import { verifyOrderOwnership, updateOrderShippingAddress } from "@/lib/shopify";

export const updateShippingAddress = tool({
  description: `Update the shipping address on an unfulfilled order.
    
    REQUIREMENTS:
    1. Verify customer via email FIRST
    2. Order must NOT be shipped yet
    3. Get complete new address from customer
    4. Confirm changes before updating
    
    Cannot update if order is already fulfilled/shipped.`,
  inputSchema: z.object({
    orderNumber: z
      .string()
      .describe("The order number to update"),
    customerEmail: z
      .string()
      .email()
      .describe("Customer email for verification"),
    newAddress: z.object({
      firstName: z
        .string()
        .optional()
        .describe("First name for shipping"),
      lastName: z
        .string()
        .optional()
        .describe("Last name for shipping"),
      address1: z
        .string()
        .describe("Street address line 1"),
      address2: z
        .string()
        .optional()
        .describe("Apartment, suite, unit, etc."),
      city: z
        .string()
        .describe("City"),
      province: z
        .string()
        .describe("State/Province code (e.g., CA, NY, ON)"),
      zip: z
        .string()
        .describe("ZIP/Postal code"),
      country: z
        .string()
        .describe("Country code (e.g., US, CA, GB)"),
      phone: z
        .string()
        .optional()
        .describe("Phone number for delivery"),
    }),
    customerConfirmed: z
      .boolean()
      .describe("Customer has confirmed the new address is correct"),
  }),
  execute: async (input) => {
    console.log("📍 updateShippingAddress called:", JSON.stringify(input, null, 2));

    // Step 1: Verify customer owns this order
    const verification = await verifyOrderOwnership(input.orderNumber, input.customerEmail);

    if (!verification.verified) {
      console.log("❌ Verification failed:", verification.reason);
      return {
        success: false,
        verified: false,
        error: verification.reason,
        message: "I couldn't verify your identity. Please check your order number and email.",
      };
    }

    console.log("✅ Customer verified");

    const order = verification.order;

    // Step 2: Check if order can be modified
    if (order.displayFulfillmentStatus === 'FULFILLED') {
      return {
        success: false,
        verified: true,
        error: "Order already shipped",
        message: `Order ${order.name} has already been shipped. Unfortunately, we can't change the address once it's in transit. You may be able to contact the carrier to redirect the package.`,
      };
    }

    if (order.cancelledAt) {
      return {
        success: false,
        verified: true,
        error: "Order cancelled",
        message: `Order ${order.name} has been cancelled and cannot be modified.`,
      };
    }

    // Step 3: Require confirmation
    if (!input.customerConfirmed) {
      const formattedAddress = formatAddress(input.newAddress);
      
      return {
        success: false,
        verified: true,
        needsConfirmation: true,
        orderNumber: order.name,
        currentStatus: order.displayFulfillmentStatus || "Unfulfilled",
        proposedAddress: formattedAddress,
        message: `Please confirm the new shipping address for order ${order.name}:\n\n${formattedAddress}\n\nIs this correct? Reply "Yes, update my address" to confirm.`,
      };
    }

    // Step 4: Update the address
    console.log("🚀 Proceeding with address update");

    try {
      const result = await updateOrderShippingAddress(input.orderNumber, input.newAddress);

      if (result.success) {
        console.log("✅ Address updated successfully");
        return {
          success: true,
          verified: true,
          updated: true,
          orderNumber: result.orderNumber,
          message: `Shipping address updated for order ${result.orderNumber}!`,
          newAddress: formatAddress(result.newAddress),
          note: "You'll receive a confirmation email with the updated details.",
        };
      } else {
        console.log("❌ Update failed:", result.error);
        return {
          success: false,
          verified: true,
          error: result.error,
          suggestion: result.suggestion,
        };
      }
    } catch (error) {
      console.error("❌ updateShippingAddress error:", error);
      return {
        success: false,
        verified: true,
        error: "Something went wrong while updating the address. Please try again or contact support.",
      };
    }
  },
});

// Helper to format address nicely
function formatAddress(address: any): string {
  const lines = [
    address.firstName && address.lastName 
      ? `${address.firstName} ${address.lastName}` 
      : null,
    address.address1,
    address.address2,
    `${address.city}, ${address.province} ${address.zip}`,
    address.country,
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}